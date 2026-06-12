import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { subDays, startOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const period = Number(req.nextUrl.searchParams.get("period") ?? 30);
    const from = startOfDay(subDays(new Date(), period));

    const [
      revenueData,
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      pendingOrders,
      lowStockProductsRaw,
      topProducts,
      orderStatusBreakdown,
      recentOrders,
    ] = await Promise.all([
      // Daily revenue for chart
      db.order.groupBy({
        by: ["createdAt"],
        where: { createdAt: { gte: from }, paymentStatus: "PAID" },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // Total revenue (all time)
      db.order.aggregate({
        where: { paymentStatus: "PAID" },
        _sum: { totalAmount: true },
      }),

      // Total orders
      db.order.count(),

      // Total customers
      db.user.count({ where: { role: "CUSTOMER" } }),

      // Total active products
      db.product.count({ where: { archived: false } }),

      // Pending orders
      db.order.count({ where: { status: "PENDING" } }),

      // Low stock products (dynamic threshold)
      db.$queryRaw<any[]>`
        SELECT id, title, stock, images FROM Product P
        WHERE P.archived = false
        AND (
          (P.stock <= P.lowStockThreshold AND NOT EXISTS (SELECT 1 FROM ProductVariant V WHERE V.productId = P.id))
          OR EXISTS (SELECT 1 FROM ProductVariant V WHERE V.productId = P.id AND V.stock <= P.lowStockThreshold)
        )
        ORDER BY P.stock ASC
        LIMIT 10
      `,

      // Top selling products
      db.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: { id: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),

      // Order status breakdown
      db.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),

      // Recent orders
      db.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: { select: { quantity: true } },
        },
      }),
    ]);

    const lowStockProducts = lowStockProductsRaw.map((p: any) => ({
      id: p.id,
      title: p.title,
      stock: p.stock,
      images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images
    }));

    // Enrich top products with names
    const productIds = topProducts.map((p: (typeof topProducts)[number]) => p.productId);
    const productDetails = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, title: true, images: true, price: true },
    });
    const topProductsEnriched = topProducts.map((tp: (typeof topProducts)[number]) => ({
      ...tp,
      product: productDetails.find((p: (typeof productDetails)[number]) => p.id === tp.productId),
    }));

    // Build revenue chart — group by day
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
    for (let i = period; i >= 0; i--) {
      const day = format(subDays(new Date(), i), "yyyy-MM-dd");
      revenueByDay[day] = { revenue: 0, orders: 0 };
    }
    for (const row of revenueData) {
      const day = format(new Date(row.createdAt), "yyyy-MM-dd");
      if (revenueByDay[day]) {
        revenueByDay[day].revenue += row._sum.totalAmount ?? 0;
        revenueByDay[day].orders += row._count.id;
      }
    }
    const revenueChart = Object.entries(revenueByDay).map(([date, val]) => ({ date, ...val }));

    // Period-specific revenue
    const periodRevenue = await db.order.aggregate({
      where: { createdAt: { gte: from }, paymentStatus: "PAID" },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // Previous period for comparison
    const prevFrom = subDays(from, period);
    const prevRevenue = await db.order.aggregate({
      where: { createdAt: { gte: prevFrom, lt: from }, paymentStatus: "PAID" },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const revenueChange =
      prevRevenue._sum.totalAmount && prevRevenue._sum.totalAmount > 0
        ? (((periodRevenue._sum.totalAmount ?? 0) - prevRevenue._sum.totalAmount) / prevRevenue._sum.totalAmount) * 100
        : 0;

    const ordersChange =
      prevRevenue._count.id > 0
        ? (((periodRevenue._count.id ?? 0) - prevRevenue._count.id) / prevRevenue._count.id) * 100
        : 0;

    return successResponse({
      kpi: {
        totalRevenue: totalRevenue._sum.totalAmount ?? 0,
        periodRevenue: periodRevenue._sum.totalAmount ?? 0,
        revenueChange: Math.round(revenueChange * 10) / 10,
        totalOrders,
        periodOrders: periodRevenue._count.id,
        ordersChange: Math.round(ordersChange * 10) / 10,
        totalCustomers,
        totalProducts,
        pendingOrders,
      },
      revenueChart,
      orderStatusBreakdown,
      topProducts: topProductsEnriched,
      lowStockProducts,
      recentOrders,
    });
  } catch (err) {
    console.error(err);
    return errorResponse("Failed to fetch analytics.", 500);
  }
}
