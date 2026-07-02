import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { generateOrderNumber } from "@/lib/utils";
import { getShippingCost, getWilayaByCode } from "@/lib/wilayas";
import { z } from "zod";
import { DeliveryType } from "@prisma/client";

// Minimum price override: must be at least 10% of product's base price
const MIN_OVERRIDE_RATIO = 0.1;

const manualOrderItemSchema = z.object({
  productId: z.string().min(1).max(50),
  quantity: z.coerce.number().int().min(1).max(999),
  priceOverride: z.coerce.number().positive().max(1_000_000).optional(),
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
});

const manualOrderSchema = z.object({
  userId: z.string().max(50).optional(),
  customerName: z.string().min(1, "Nom client requis").max(100),
  customerPhone: z.string().min(9, "Téléphone requis").max(20),
  customerEmail: z.string().email().max(254).optional().or(z.literal("")),

  items: z.array(manualOrderItemSchema).min(1, "Au moins un produit requis").max(50),

  wilayaCode: z.string().min(1, "Wilaya requise").max(5),
  deliveryType: z.enum(["DOMICILE", "STOPDESK"]),
  street: z.string().max(200).optional(),
  city: z.string().max(100).optional(),

  paymentMethod: z.enum(["cod", "stripe", "virement", "autre"]).default("cod"),
  // CONFIRMATRICE cannot directly mark an order as PAID — only ADMIN can
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED"]).default("PENDING"),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING"]).default("PENDING"),
  discount: z.coerce.number().min(0).max(1_000_000).default(0),
  notes: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "ADMIN" && role !== "CONFIRMATRICE") {
      return errorResponse("Unauthorized", 401);
    }

    const body = await req.json();
    const parsed = manualOrderSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const {
      userId, customerName, customerPhone, customerEmail,
      items, wilayaCode, deliveryType, street, city,
      paymentMethod, paymentStatus, status, discount, notes,
    } = parsed.data;

    // CONFIRMATRICE cannot set paymentStatus to PAID directly
    if (role === "CONFIRMATRICE" && paymentStatus === "PAID") {
      return errorResponse("Accès refusé: seul un admin peut marquer un paiement comme reçu.", 403);
    }

    const wilaya = getWilayaByCode(wilayaCode);
    if (!wilaya) return errorResponse("Wilaya invalide.", 400);

    const productIds = items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true },
    });

    const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]));

    for (const item of items) {
      if (!productMap[item.productId]) {
        return errorResponse(`Produit introuvable: ${item.productId}`, 400);
      }
    }

    // Build resolved items — validate price overrides
    const resolvedItems: any[] = [];
    for (const item of items) {
      const p = productMap[item.productId];
      const basePrice = p.discountPrice ?? p.price;

      if (item.priceOverride !== undefined) {
        const minAllowed = basePrice * MIN_OVERRIDE_RATIO;
        if (item.priceOverride < minAllowed) {
          return errorResponse(
            `Prix trop bas pour "${p.title}": minimum ${Math.ceil(minAllowed)} DZD (10% du prix de base).`,
            400
          );
        }
      }

      // Check variant matching size and/or color
      let variantId: string | null = null;
      let stock = p.stock;
      let variantImage: string | null = null;
      if (item.size || item.color) {
        const variant = p.variants.find(
          (v: any) =>
            (!item.size || v.size === item.size) &&
            (!item.color || v.color === item.color)
        );
        if (variant) {
          variantId = variant.id;
          stock = variant.stock;
          variantImage = variant.image ?? null;
        }
      }

      resolvedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: item.priceOverride ?? basePrice,
        productTitle: p.title,
        productImage: variantImage ?? p.images[0] ?? null,
        size: item.size || null,
        color: item.color || null,
        variantId,
        _stock: stock,
      });
    }

    // Stock check before transaction
    for (const item of resolvedItems) {
      if (item._stock < item.quantity) {
        return errorResponse(`Stock insuffisant pour "${item.productTitle}": ${item._stock} disponible(s).`, 400);
      }
    }

    const subtotal = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingFee = getShippingCost(wilayaCode, deliveryType, subtotal);
    const totalAmount = Math.max(0, subtotal + shippingFee - discount);

    // Resolve user
    let resolvedUserId = userId;
    if (!resolvedUserId) {
      const phoneClean = customerPhone.trim();
      if (customerEmail) {
        const existing = await db.user.findUnique({ where: { email: customerEmail } });
        resolvedUserId = existing?.id;
      }
      if (!resolvedUserId && phoneClean) {
        const existing = await db.user.findFirst({ where: { phone: phoneClean } });
        resolvedUserId = existing?.id;
      }
    }

    if (!resolvedUserId) {
      if (customerEmail) {
        const ghost = await db.user.create({
          data: {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            role: "CUSTOMER",
            emailVerified: new Date(),
          },
        });
        resolvedUserId = ghost.id;
      } else {
        // Automatically provision a guest account (passwordless) using phone
        const ghost = await db.user.create({
          data: {
            name: customerName,
            phone: customerPhone,
            role: "CUSTOMER",
          },
        });
        resolvedUserId = ghost.id;
      }
    }

    // Sanitize resolvedItems (remove internal _stock field)
    const orderItems = resolvedItems.map(({ _stock: _, ...rest }) => rest);

    const order = await db.$transaction(async (tx: any) => {
      const ord = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: resolvedUserId!,
          status,
          paymentStatus,
          paymentMethod,
          subtotal,
          shippingFee,
          taxAmount: 0,
          discount,
          totalAmount,
          deliveryType: deliveryType as DeliveryType,
          wilayaCode,
          shippingFirstName: customerName.split(" ")[0] ?? customerName,
          shippingLastName: customerName.split(" ").slice(1).join(" ") || "",
          shippingPhone: customerPhone,
          shippingStreet: street ?? null,
          shippingCity: city ?? wilaya.name,
          shippingState: wilaya.name,
          shippingPostalCode: wilayaCode,
          shippingCountry: "Algérie",
          notes: notes
            ? `[COMMANDE MANUELLE — ${session!.user?.name ?? "Admin"}] ${notes}`
            : `[COMMANDE MANUELLE — ${session!.user?.name ?? "Admin"}]`,
          items: { create: orderItems },
          statusHistory: {
            create: {
              status,
              note: `Commande créée manuellement par ${session!.user?.name ?? "Admin"} (${role})`,
              changedById: session!.user?.id,
            },
          },
        },
        include: { items: true },
      });

      // Atomic stock deduction for base product or variant specifically
      for (const item of resolvedItems) {
        if (item.variantId) {
          const updated = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`STOCK_DEPLETED:${item.productTitle}`);
          }
        } else {
          const updated = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new Error(`STOCK_DEPLETED:${item.productTitle}`);
          }
        }
      }

      return ord;
    });

    return successResponse(order, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.startsWith("STOCK_DEPLETED:")) {
      return errorResponse(`Rupture de stock: "${msg.replace("STOCK_DEPLETED:", "")}"`, 409);
    }
    console.error("[manual order]", err);
    return errorResponse("Échec de la création de la commande.", 500);
  }
}
