import { NextRequest } from "next/server";
import { Prisma, DeliveryType } from "@prisma/client";
import { db } from "@/lib/db";
import { checkoutSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateOrderNumber } from "@/lib/utils";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { auth } from "@/auth";
import { getShippingCost, getWilayaByCode } from "@/lib/wilayas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(ip, "orders", 10, 60 * 1000)) {
      return errorResponse("Trop de tentatives de commande. Veuillez réessayer plus tard.", 429);
    }

    const session = await auth();
    const body = await req.json();

    // 1. Validate customer billing/shipping details
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.errors[0].message);
    }

    const {
      firstName, lastName, phone, wilayaCode, deliveryType,
      street, city, couponCode, paymentMethod, notes,
      isInternational, country,
    } = parsed.data;

    // 2. Identify or Auto-Create Customer Account (satisfies DB foreign key constraint)
    let userId: string;
    let dbUser = null;
    if (session?.user?.id) {
      dbUser = await db.user.findUnique({ where: { id: session.user.id } });
    }

    if (dbUser) {
      userId = dbUser.id;
    } else {
      // Look for an existing user with this exact phone number
      const existingUser = await db.user.findFirst({
        where: { phone: phone.trim() },
      });

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Automatically provision a guest account (passwordless)
        const guestUser = await db.user.create({
          data: {
            name: `${firstName.trim()} ${lastName.trim()}`,
            phone: phone.trim(),
            role: "CUSTOMER",
          },
        });
        userId = guestUser.id;
      }
    }

    // 3. Resolve cart items from body (guest cart stored in Zustand) or DB (logged-in fallback)
    let cartItems: {
      productId: string;
      quantity: number;
      variantId?: string | null;
      size?: string | null;
      color?: string | null;
      product: {
        id: string;
        title: string;
        price: number;
        discountPrice: number | null;
        stock: number;
        images: string[];
      };
      price: number;
      variantImage?: string | null;
    }[] = [];

    const reqItems = body.items as {
      productId: string;
      quantity: number;
      variantId?: string | null;
      size?: string | null;
      color?: string | null;
    }[];

    if (!reqItems || reqItems.length === 0) {
      // If no items in body, fall back to DB cart for authenticated users
      if (session?.user?.id) {
        const dbItems = await db.cartItem.findMany({
          where: { userId: session.user.id },
          include: { product: true },
        });

        if (dbItems.length > 0) {
          const variantIds = dbItems.map((i: any) => i.variantId).filter(Boolean) as string[];
          const variants = variantIds.length > 0 
            ? await db.productVariant.findMany({ where: { id: { in: variantIds } } })
            : [];

          cartItems = dbItems.map((item: any) => {
            const variant = item.variantId ? variants.find((v: any) => v.id === item.variantId) : null;
            const price = isInternational
              ? (variant?.priceEur ?? item.product.discountPriceEur ?? item.product.priceEur ?? 0)
              : (variant?.price ?? item.product.discountPrice ?? item.product.price);
            return {
              productId: item.productId,
              quantity: item.quantity,
              variantId: item.variantId,
              size: item.size,
              color: item.color,
              product: {
                id: item.product.id,
                title: item.product.title,
                price: item.product.price,
                discountPrice: item.product.discountPrice,
                stock: variant?.stock ?? item.product.stock,
                images: item.product.images,
              },
              price,
              variantImage: variant?.image ?? null,
            };
          });
        }
      }
    } else {
      // Securely fetch catalog info for body items
      const productIds = reqItems.map((i: any) => i.productId);
      const products = await db.product.findMany({
        where: { id: { in: productIds } },
        include: { variants: true },
      });

      for (const item of reqItems) {
        const product = products.find((p: any) => p.id === item.productId);
        if (!product) return errorResponse(`Produit non trouvé : ${item.productId}`, 404);

        let price = isInternational 
          ? (product.discountPriceEur ?? product.priceEur ?? 0)
          : (product.discountPrice ?? product.price);
        let stock = product.stock;
        let variantImage: string | null = null;

        if (item.variantId) {
          const variant = product.variants.find((v: any) => v.id === item.variantId);
          if (variant) {
            price = isInternational ? (variant.priceEur ?? price) : (variant.price ?? price);
            stock = variant.stock;
            variantImage = variant.image ?? null;
          }
        }

        cartItems.push({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          product: {
            id: product.id,
            title: product.title,
            price: product.price,
            discountPrice: product.discountPrice,
            stock,
            images: product.images,
          },
          price,
          variantImage,
        });
      }
    }

    if (cartItems.length === 0) {
      return errorResponse("Votre panier est vide.", 400);
    }

    // 4. Pre-flight stock validation
    for (const item of cartItems) {
      if (item.product.stock < item.quantity) {
        return errorResponse(`"${item.product.title}" n'est plus disponible en quantité suffisante.`, 400);
      }
    }

    // 5. Shipping fees and Wilaya calculations
    const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
    let shippingFee = 0;
    let wilaya: any;

    if (isInternational) {
      if (!country) return errorResponse("Pays sélectionné invalide.", 400);
      shippingFee = 0; // Standard initial fee, wait for manual confirmation via WhatsApp
    } else {
      wilaya = getWilayaByCode(wilayaCode ?? "");
      if (!wilaya) return errorResponse("Wilaya sélectionnée invalide.", 400);
      shippingFee = getShippingCost(wilayaCode ?? "", deliveryType as DeliveryType, subtotal);
    }
    const taxAmount = 0;
    let discount = 0;
    let couponId: string | undefined;

    // 6. Validate promo coupon
    if (couponCode) {
      const coupon = await db.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (!coupon || !coupon.isActive) return errorResponse("Code coupon invalide.", 400);
      if (coupon.expiresAt && coupon.expiresAt < new Date()) return errorResponse("Ce coupon a expiré.", 400);
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        return errorResponse("Ce coupon a atteint sa limite d'utilisation.", 400);
      }
      if (coupon.minPurchase && subtotal < coupon.minPurchase) {
        return errorResponse(`Achat minimum de ${coupon.minPurchase} DZD requis pour ce coupon.`, 400);
      }

      const couponProductIds = (coupon as unknown as { productIds: string[] }).productIds ?? [];
      let eligibleSubtotal = subtotal;
      if (couponProductIds.length > 0) {
        const matchingItems = cartItems.filter((item: any) => couponProductIds.includes(item.productId));
        if (matchingItems.length === 0) {
          return errorResponse("Ce coupon ne s'applique pas aux produits de votre panier.", 400);
        }
        eligibleSubtotal = matchingItems.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0);
      }

      discount = coupon.discountType === "PERCENTAGE"
        ? (eligibleSubtotal * coupon.discountValue) / 100
        : Math.min(coupon.discountValue, eligibleSubtotal);
      couponId = coupon.id;
    }

    const totalAmount = Math.max(0, subtotal + shippingFee + taxAmount - discount);

    // 7. Atomic DB Transaction to secure inventory & checkout
    const order = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const ord = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          subtotal,
          shippingFee,
          taxAmount,
          discount,
          totalAmount,
          paymentMethod,
          isInternational,
          deliveryType: (deliveryType as DeliveryType) ?? "DOMICILE",
          wilayaCode: wilayaCode ?? null,
          notes: notes ?? null,
          couponId: couponId ?? null,
          couponCode: couponCode ?? null,
          shippingFirstName: firstName,
          shippingLastName: lastName,
          shippingStreet: street ?? null,
          shippingCity: city ?? (wilaya?.name || country),
          shippingState: wilaya?.name ?? null,
          shippingPostalCode: wilayaCode ?? null,
          shippingCountry: isInternational ? (country ?? "International") : "Algérie",
          shippingPhone: phone,
          items: {
            create: cartItems.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              size: item.size ?? null,
              color: item.color ?? null,
              productTitle: item.product.title,
              productImage: item.variantImage ?? item.product.images[0] ?? null,
            })),
          },
          statusHistory: { create: { status: "PENDING", note: "Commande enregistrée" } },
        },
        include: { items: true },
      });

      // Deduct inventory atomically (general or variant-specific)
      for (const item of cartItems) {
        if (item.variantId) {
          const updatedVariant = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updatedVariant.count === 0) {
            throw new Error(`STOCK_DEPLETED:${item.product.title}`);
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`STOCK_DEPLETED:${item.product.title}`);
          }
        }
      }

      // Re-verify coupon limit to prevent concurrency bypass
      if (couponId) {
        const freshCoupon = await tx.coupon.findUnique({
          where: { id: couponId },
          select: { maxUses: true, usedCount: true },
        });
        if (freshCoupon?.maxUses && freshCoupon.usedCount >= freshCoupon.maxUses) {
          throw new Error("COUPON_EXHAUSTED");
        }
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear user database cart if logged in
      if (session?.user?.id) {
        await tx.cartItem.deleteMany({ where: { userId: session.user.id } });
      }

      return ord;
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });

    // 8. Order notification email
    const customer = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });
    if (customer?.email) {
      sendOrderConfirmationEmail(
        customer.email,
        customer.name ?? "Client",
        order.orderNumber,
        order.totalAmount,
        order.items.map((i: any) => ({ productTitle: i.productTitle, quantity: i.quantity, price: i.price }))
      ).catch(() => null);
    }

    return successResponse(order, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("STOCK_DEPLETED:")) {
      return errorResponse(`Rupture de stock: "${msg.replace("STOCK_DEPLETED:", "")}"`, 409);
    }
    if (msg === "COUPON_EXHAUSTED") {
      return errorResponse("Ce coupon vient d'atteindre sa limite d'utilisation.", 409);
    }
    console.error("[orders/POST]", err);
    return errorResponse("Échec de la commande. Veuillez réessayer.", 500);
  }
}
