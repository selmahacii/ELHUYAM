import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { addToCartSchema, updateCartSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

async function verifySession(actionName: string) {
  const session = await auth();
  if (!session) {
    console.warn(`[Cart API] ${actionName} failed: No session found (auth() returned null).`);
    return null;
  }
  if (!session.user?.id) {
    console.warn(`[Cart API] ${actionName} failed: Session exists but user.id is missing.`, session);
    return null;
  }

  const userExists = await db.user.findUnique({ where: { id: session.user.id } });
  if (!userExists) {
    console.warn(`[Cart API] ${actionName} failed: User ID "${session.user.id}" from session does not exist in the database.`);
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await verifySession("GET");
    if (!session) return errorResponse("Unauthorized", 401);

    const items = await db.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true, title: true, slug: true, price: true,
            discountPrice: true, priceEur: true, discountPriceEur: true,
            images: true, stock: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Enrich with variant prices
    const variantIds = items
      .map((i: { variantId: string | null }) => i.variantId)
      .filter((id: string | null): id is string => !!id);
    const variants = variantIds.length > 0
      ? await db.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: { id: true, price: true, priceEur: true },
        })
      : [];
    const variantMap = Object.fromEntries(
      variants.map((v: any) => [v.id, { price: v.price, priceEur: v.priceEur }])
    );

    const enriched = items.map((item: any) => ({
      ...item,
      variant: item.variantId
        ? {
            id: item.variantId,
            price: variantMap[item.variantId]?.price ?? null,
            priceEur: variantMap[item.variantId]?.priceEur ?? null,
          }
        : null,
    }));

    return successResponse(enriched);
  } catch (error) {
    console.error("[CART_GET_ERROR]", error);
    return errorResponse("Failed to fetch cart.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession("POST");
    if (!session) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { productId, variantId, quantity, size, color } = parsed.data;

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return errorResponse("Product not found", 404);

    let maxStock = product.stock;
    if (variantId) {
      const variant = await db.productVariant.findUnique({ where: { id: variantId } });
      if (!variant) return errorResponse("Product variant not found", 404);
      maxStock = variant.stock;
    }

    // Get current item in cart using findFirst (to support null variantId properly)
    const existing = await db.cartItem.findFirst({
      where: {
        userId: session.user.id,
        productId,
        variantId: variantId || null,
      },
    });

    const totalQuantity = (existing?.quantity ?? 0) + quantity;
    if (maxStock < totalQuantity) {
      return errorResponse(
        existing?.quantity 
          ? `Vous avez déjà ${existing.quantity} article(s) dans votre panier. Stock maximum disponible: ${maxStock}.`
          : `Stock insuffisant. Seulement ${maxStock} articles disponibles.`, 
        400
      );
    }

    let cartItem;
    if (existing) {
      cartItem = await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: { increment: quantity } },
        include: {
          product: {
            select: {
              title: true, price: true, priceEur: true,
              discountPrice: true, discountPriceEur: true, images: true,
            },
          },
        },
      });
    } else {
      cartItem = await db.cartItem.create({
        data: {
          userId: session.user.id,
          productId,
          variantId: variantId || null,
          quantity,
          size: size || null,
          color: color || null,
        },
        include: {
          product: {
            select: {
              title: true, price: true, priceEur: true,
              discountPrice: true, discountPriceEur: true, images: true,
            },
          },
        },
      });
    }

    return successResponse(cartItem, 201);
  } catch (error) {
    console.error("[CART_POST_ERROR]", error);
    return errorResponse("Failed to add to cart.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await verifySession("PATCH");
    if (!session) return errorResponse("Unauthorized", 401);

    // Use schema validation — prevents unbounded quantity and missing itemId
    const body = await req.json();
    const parsed = updateCartSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { itemId, quantity } = parsed.data;

    // Ownership check — ensure item belongs to this user
    const item = await db.cartItem.findFirst({
      where: { id: itemId, userId: session.user.id },
      include: { product: { select: { stock: true, title: true } } },
    });
    if (!item) return errorResponse("Cart item not found", 404);
    if (item.product.stock < quantity)
      return errorResponse(`Stock insuffisant pour "${item.product.title}"`, 400);

    const updated = await db.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return successResponse(updated);
  } catch (error) {
    console.error("[CART_PATCH_ERROR]", error);
    return errorResponse("Failed to update cart.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await verifySession("DELETE");
    if (!session) return errorResponse("Unauthorized", 401);

    const { itemId } = await req.json();
    if (!itemId || typeof itemId !== "string") return errorResponse("itemId requis");

    // Ownership enforced via composite WHERE
    await db.cartItem.deleteMany({
      where: { id: itemId, userId: session.user.id },
    });

    return successResponse({ message: "Item removed from cart." });
  } catch (error) {
    console.error("[CART_DELETE_ERROR]", error);
    return errorResponse("Failed to remove item.", 500);
  }
}
