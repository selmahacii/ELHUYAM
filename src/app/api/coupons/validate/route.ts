import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!rateLimit(ip, "coupon", 10, 60 * 1000)) {
      return errorResponse("Trop de tentatives de validation. Veuillez réessayer plus tard.", 429);
    }

    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { code, subtotal, productIds = [], items = [] } = await req.json();
    if (!code) return errorResponse("Coupon code requis");

    const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) return errorResponse("Code coupon invalide.");
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return errorResponse("Ce coupon a expiré.");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) return errorResponse("Limite d'utilisation atteinte.");

    const couponProductIds = (coupon as unknown as { productIds: string[] }).productIds ?? [];

    let resolvedSubtotal = subtotal;
    let eligibleSubtotal = subtotal;

    if (items && items.length > 0) {
      // Securely fetch catalog info for the items to prevent client tampering
      const dbProducts = await db.product.findMany({
        where: { id: { in: items.map((i: any) => i.productId) } },
        include: { variants: true },
      });

      let calculatedSubtotal = 0;
      let calculatedEligibleSubtotal = 0;

      for (const item of items) {
        const product = dbProducts.find((p: any) => p.id === item.productId);
        if (!product) continue;

        let price = product.discountPrice ?? product.price;
        if (item.variantId) {
          const variant = product.variants.find((v: any) => v.id === item.variantId);
          if (variant) {
            price = variant.price ?? price;
          }
        }

        const itemTotal = price * item.quantity;
        calculatedSubtotal += itemTotal;

        if (couponProductIds.length === 0 || couponProductIds.includes(item.productId)) {
          calculatedEligibleSubtotal += itemTotal;
        }
      }

      resolvedSubtotal = calculatedSubtotal;
      eligibleSubtotal = calculatedEligibleSubtotal;
    }

    if (coupon.minPurchase && resolvedSubtotal < Number(coupon.minPurchase)) {
      return errorResponse(`Commande minimum de ${Number(coupon.minPurchase)} DZD requise.`);
    }

    // If coupon is restricted to specific products, verify cart contains at least one and has eligible subtotal
    if (couponProductIds.length > 0) {
      const cartProductIds = items.length > 0 ? items.map((i: any) => i.productId) : productIds;
      const hasMatch = cartProductIds.some((id: string) => couponProductIds.includes(id));
      if (!hasMatch || eligibleSubtotal === 0) {
        return errorResponse("Ce coupon ne s'applique pas aux produits dans votre panier.");
      }
    }

    const discount =
      coupon.discountType === "PERCENTAGE"
        ? (eligibleSubtotal * Number(coupon.discountValue)) / 100
        : Math.min(Number(coupon.discountValue), eligibleSubtotal);

    return successResponse({
      valid: true,
      coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: Number(coupon.discountValue) },
      discount,
    });
  } catch (err) {
    console.error("[coupon/validate]", err);
    return errorResponse("Échec de la validation du coupon.", 500);
  }
}
