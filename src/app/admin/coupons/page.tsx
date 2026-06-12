import { db } from "@/lib/db";
import CouponManager from "./coupon-manager";

export default async function AdminCouponsPage() {
  const [coupons, products] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    db.product.findMany({
      where: { archived: false },
      select: { id: true, title: true, price: true, discountPrice: true },
      orderBy: { title: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-gray-900">Coupons & Réductions</h1>
        <p className="text-gray-400 text-sm mt-0.5">{coupons.length} coupon{coupons.length !== 1 ? "s" : ""}</p>
      </div>

      <CouponManager
        coupons={coupons.map((c: (typeof coupons)[number]) => ({
          id: c.id,
          code: c.code,
          discountType: c.discountType,
          discountValue: Number(c.discountValue),
          minPurchase: c.minPurchase ? Number(c.minPurchase) : null,
          maxUses: c.maxUses ?? null,
          usedCount: c.usedCount,
          isActive: c.isActive,
          expiresAt: c.expiresAt ? c.expiresAt.toISOString() : null,
          productIds: (c as unknown as { productIds: string[] }).productIds ?? [],
          createdAt: c.createdAt.toISOString(),
        }))}
        products={products.map((p: (typeof products)[number]) => ({
          id: p.id,
          title: p.title,
          price: Number(p.price),
          discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
        }))}
      />
    </div>
  );
}
