import { db } from "@/lib/db";
import { formatPrice, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  DollarSign, ShoppingBag, Package, Users,
  ArrowUpRight, ArrowDownRight, AlertTriangle, Clock, TrendingUp, ArrowRight, Activity,
  Coins, MessageSquare, MapPin, Truck, History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { subDays, startOfDay } from "date-fns";
import { unstable_cache } from "next/cache";
import { getWilayaByCode } from "@/lib/wilayas";

const ORDER_STATUS_EN: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const ORDER_STATUS_BADGE: Record<string, "warning" | "info" | "success" | "destructive" | "luxury"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "luxury",
};

const getCachedDashboardAggregates = (period: string) => unstable_cache(
  async () => {
    const days = period === "day" ? 1 : period === "week" ? 7 : 30;
    const currentFrom = startOfDay(subDays(new Date(), days));
    const previousFrom = startOfDay(subDays(new Date(), days * 2));

    const [
      currentRevenue, previousRevenue,
      currentOrders, previousOrders,
      totalCustomers, previousCustomers,
      totalProducts,
      orderStatusBreakdown,
      topProductsRaw,
      revenueTransit,
      pendingProductReviews,
      pendingPublicReviews,
      wilayaData,
      deliveryTypeData,
    ] = await Promise.all([
      db.order.aggregate({ where: { createdAt: { gte: currentFrom }, paymentStatus: "PAID" }, _sum: { subtotal: true, discount: true } }),
      db.order.aggregate({ where: { createdAt: { gte: previousFrom, lt: currentFrom }, paymentStatus: "PAID" }, _sum: { subtotal: true, discount: true } }),
      db.order.count({ where: { createdAt: { gte: currentFrom } } }),
      db.order.count({ where: { createdAt: { gte: previousFrom, lt: currentFrom } } }),
      db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: currentFrom } } }),
      db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: previousFrom, lt: currentFrom } } }),
      db.product.count({ where: { archived: false } }),
      db.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: currentFrom } },
        _count: { id: true }
      }),
      db.orderItem.groupBy({
        by: ["productId", "productTitle"],
        where: { order: { createdAt: { gte: currentFrom } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      db.order.aggregate({
        where: { createdAt: { gte: currentFrom }, status: { in: ["SHIPPED", "OUT_FOR_DELIVERY"] }, paymentStatus: "PENDING" },
        _sum: { subtotal: true, discount: true }
      }),
      db.review.count({ where: { status: "PENDING" } }),
      db.publicReview.count({ where: { status: "PENDING" } }),
      db.order.groupBy({
        by: ["wilayaCode"],
        where: { createdAt: { gte: currentFrom } },
        _count: { id: true },
        _sum: { subtotal: true, discount: true },
        orderBy: { _count: { id: "desc" } },
        take: 5
      }),
      db.order.groupBy({
        by: ["deliveryType"],
        where: { createdAt: { gte: currentFrom } },
        _count: { id: true }
      }),
    ]);

    return {
      currentRevenue,
      previousRevenue,
      currentOrders,
      previousOrders,
      totalCustomers,
      previousCustomers,
      totalProducts,
      orderStatusBreakdown,
      topProductsRaw,
      revenueTransit,
      pendingProductReviews,
      pendingPublicReviews,
      wilayaData,
      deliveryTypeData,
    };
  },
  [`admin-dashboard-aggregates-${period}`],
  { revalidate: 60, tags: ["orders", "products", "users"] }
);

async function getDashboardData(period: string) {
  const aggregates = await getCachedDashboardAggregates(period)();

  const [pendingOrders, lowStockProductsRaw, lowStockVariantsRaw, recentOrders, staffActivity] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.$queryRaw<any[]>`
      SELECT id, title, stock FROM "Product" P
      WHERE P.archived = false
      AND P.stock <= P."lowStockThreshold"
      AND NOT EXISTS (SELECT 1 FROM "ProductVariant" V WHERE V."productId" = P.id)
      ORDER BY P.stock ASC
      LIMIT 5
    `,
    db.$queryRaw<any[]>`
      SELECT V.id, V.size, V.color, V.stock, P.id as "productId", P.title as "productTitle"
      FROM "ProductVariant" V
      INNER JOIN "Product" P ON V."productId" = P.id
      WHERE P.archived = false
      AND V.stock <= P."lowStockThreshold"
      ORDER BY V.stock ASC
      LIMIT 5
    `,
    db.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, items: { select: { quantity: true } } },
    }),
    db.orderStatusHistory.findMany({
      where: { NOT: { changedById: null } },
      include: {
        changedBy: { select: { name: true, role: true } },
        order: { select: { orderNumber: true, id: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
  ]);

  const lowStockProducts = lowStockProductsRaw.map((p: any) => ({
    id: p.id,
    title: p.title,
    stock: p.stock
  }));

  const lowStockVariants = lowStockVariantsRaw.map((v: any) => ({
    id: v.id,
    size: v.size,
    color: v.color,
    stock: v.stock,
    product: {
      id: v.productId,
      title: v.productTitle
    }
  }));

  function calcChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  const currentRev = Math.max(0, Number(aggregates.currentRevenue._sum.subtotal ?? 0) - Number(aggregates.currentRevenue._sum.discount ?? 0));
  const prevRev = Math.max(0, Number(aggregates.previousRevenue._sum.subtotal ?? 0) - Number(aggregates.previousRevenue._sum.discount ?? 0));
  const transitRev = Math.max(0, Number(aggregates.revenueTransit._sum.subtotal ?? 0) - Number(aggregates.revenueTransit._sum.discount ?? 0));
  const totalPendingReviews = aggregates.pendingProductReviews + aggregates.pendingPublicReviews;

  const labelSuffix = period === "day" ? " Today" : period === "week" ? " (7d)" : " (30d)";
  const compareText = period === "day" ? "vs yesterday" : period === "week" ? "vs prev. 7d" : "vs prev. 30d";

  return {
    kpis: [
      { 
        title: `Collected Rev${labelSuffix}`, 
        value: formatPrice(currentRev), 
        change: calcChange(currentRev, prevRev), 
        compareText,
        icon: DollarSign, 
        href: "/admin/analytics",
        iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100"
      },
      { 
        title: `Transit COD Rev${labelSuffix}`, 
        value: formatPrice(transitRev), 
        change: 0, 
        compareText,
        icon: Coins, 
        href: "/admin/orders?status=SHIPPED",
        iconClass: "bg-amber-50 text-amber-600 border-amber-100"
      },
      { 
        title: `Orders${labelSuffix}`, 
        value: aggregates.currentOrders.toLocaleString(), 
        change: calcChange(aggregates.currentOrders, aggregates.previousOrders), 
        compareText,
        icon: ShoppingBag, 
        href: "/admin/orders",
        iconClass: "bg-sky-50 text-sky-600 border-sky-100"
      },
      { 
        title: "Active Products", 
        value: aggregates.totalProducts.toLocaleString(), 
        change: 0, 
        compareText: "Stable total",
        icon: Package, 
        href: "/admin/products",
        iconClass: "bg-purple-50 text-purple-600 border-purple-100"
      },
    ],
    pendingOrders,
    totalPendingReviews,
    lowStockProducts,
    lowStockVariants,
    recentOrders,
    staffActivity,
    orderStatusBreakdown: aggregates.orderStatusBreakdown,
    topProducts: aggregates.topProductsRaw.map((p: any) => ({
      productId: p.productId,
      title: p.productTitle,
      qty: p._sum.quantity ?? 0,
    })),
    wilayaData: aggregates.wilayaData,
    deliveryTypeData: aggregates.deliveryTypeData,
  };
}

interface SearchParams { 
  searchParams: Promise<{ period?: string }> 
}

export default async function AdminDashboard({ searchParams }: SearchParams) {
  const sp = await searchParams;
  const period = sp.period === "day" || sp.period === "week" ? sp.period : "month";
  
  const { 
    kpis, pendingOrders, totalPendingReviews, lowStockProducts, lowStockVariants, 
    recentOrders, staffActivity, orderStatusBreakdown, topProducts, wilayaData, deliveryTypeData 
  } = await getDashboardData(period);

  // Find max breakdown count for progress bar calculations
  const maxBreakdown = orderStatusBreakdown.length > 0 
    ? Math.max(...orderStatusBreakdown.map((o: any) => o._count.id)) 
    : 1;

  const totalLowStockCount = lowStockProducts.length + lowStockVariants.length;

  const topWilayasEnriched = wilayaData.map((w: any) => {
    const wilaya = getWilayaByCode(w.wilayaCode ?? "");
    return {
      code: w.wilayaCode ?? "UNKNOWN",
      name: wilaya ? wilaya.nameAr : "غير محدد",
      count: w._count.id,
      total: Math.max(0, (w._sum.subtotal ?? 0) - (w._sum.discount ?? 0)),
    };
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">Dashboard</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            Real-time overview of your shop&apos;s operational and commercial activity.
          </p>
        </div>

        {/* Sleek Period filter */}
        <div className="flex gap-1 bg-slate-100/70 p-1 border border-slate-200/50 rounded-2xl shrink-0 text-xs">
          {[
            { value: "day", label: "Today" },
            { value: "week", label: "7 Days" },
            { value: "month", label: "30 Days" }
          ].map((p) => {
            const isActive = period === p.value;
            return (
              <Link 
                key={p.value} 
                href={`/admin?period=${p.value}`}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                  isActive 
                    ? "bg-slate-950 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/40"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ title, value, change, compareText, icon: Icon, href, iconClass }) => (
          <Link 
            key={title} 
            href={href} 
            className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm hover:shadow transition-all duration-300 flex flex-col justify-between min-h-[135px] group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{title}</p>
                <h3 className="font-display text-xl sm:text-2xl text-slate-950 font-bold tracking-tight mt-1">{value}</h3>
              </div>
              <div className={`p-2.5 border rounded-xl shrink-0 group-hover:scale-105 transition-transform duration-200 ${iconClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
              {change !== 0 ? (
                <div className="flex items-center gap-1">
                  <div className={`flex items-center gap-0.5 rounded-lg px-2 py-0.5 border ${
                    change > 0 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" 
                      : "bg-rose-50 text-rose-700 border-rose-100/50"
                  }`}>
                    {change > 0 ? (
                      <ArrowUpRight className="w-3 h-3 shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold font-mono">
                      {change > 0 ? "+" : ""}{change}%
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-455 font-medium text-slate-450">{compareText}</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Activity className="w-3 h-3 text-slate-400" /> {compareText}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Operational Alerts ── */}
      {(pendingOrders > 0 || totalLowStockCount > 0 || totalPendingReviews > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pendingOrders > 0 && (
            <Link 
              href="/admin/orders?status=PENDING" 
              className="flex items-center gap-4 bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl shadow-2xs hover:bg-amber-100/40 hover:shadow-xs transition-all group"
            >
              <div className="p-2.5 bg-amber-100 border border-amber-200/50 rounded-xl text-amber-700 relative">
                <Clock className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-amber-600 border border-white shadow-xs animate-ping" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-amber-900 text-sm">{pendingOrders} pending order{pendingOrders > 1 ? "s" : ""}</p>
                <p className="text-amber-700 text-xs mt-0.5 font-medium">Require fast validation</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {totalLowStockCount > 0 && (
            <Link 
              href="/admin/products?lowStock=true" 
              className="flex items-center gap-4 bg-red-50/60 border border-red-200/80 p-4 rounded-2xl shadow-2xs hover:bg-red-100/40 hover:shadow-xs transition-all group"
            >
              <div className="p-2.5 bg-red-100 border border-red-200/50 rounded-xl text-red-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-red-900 text-sm">{totalLowStockCount} low stock item{totalLowStockCount > 1 ? "s" : ""}</p>
                <p className="text-red-750 text-[10px] mt-0.5 font-semibold truncate leading-tight">
                  {[
                    ...lowStockProducts.map((p: any) => p.title),
                    ...lowStockVariants.map((v: any) => `${v.product.title} (${v.size ?? ""}${v.size && v.color ? " - " : ""}${v.color ?? ""})`)
                  ].join(", ")}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-red-700 shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}

          {totalPendingReviews > 0 && (
            <Link 
              href="/admin/reviews?status=PENDING" 
              className="flex items-center gap-4 bg-[#FAF5FF] border border-[#E9D5FF] p-4 rounded-2xl shadow-2xs hover:bg-[#F3E8FF] hover:shadow-xs transition-all group"
            >
              <div className="p-2.5 bg-[#F3E8FF] border border-[#E9D5FF]/50 rounded-xl text-[#7E22CE]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[#581C87] text-sm">{totalPendingReviews} review{totalPendingReviews > 1 ? "s" : ""} pending</p>
                <p className="text-[#7E22CE] text-xs mt-0.5 font-medium">Require moderation check</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#7E22CE] shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      )}

      {/* ── Main Dashboard Layout Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Orders & Geographic/Delivery Analytics (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Orders Card */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-display text-sm font-bold text-slate-900">Recent Orders</h2>
                <Link 
                  href="/admin/orders" 
                  className="text-[10px] uppercase tracking-wider text-slate-400 hover:text-slate-900 font-bold transition-all"
                >
                  View all →
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/20">
                      {["Order N°", "Customer", "Amount", "Parcel Status", "Date"].map((h) => (
                        <th key={h} className="px-5 py-3 text-[10px] uppercase tracking-wider text-slate-400 font-bold text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-xs font-semibold italic">
                          No orders registered.
                        </td>
                      </tr>
                    )}
                    {recentOrders.map((order: any) => (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                        {/* Order Number Tag */}
                        <td className="px-5 py-3.5">
                          <Link 
                            href={`/admin/orders/${order.id}`} 
                            className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 rounded-lg shadow-2xs hover:bg-slate-200 transition-colors"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        {/* Customer Details */}
                        <td className="px-5 py-3.5">
                          <p className="text-slate-900 font-bold text-xs">{order.user?.name ?? "Guest Customer"}</p>
                          {order.user?.email && (
                            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">{order.user.email}</p>
                          )}
                        </td>
                        {/* Price Amount */}
                        <td className="px-5 py-3.5 font-bold text-slate-950 text-xs sm:text-sm font-mono">
                          {formatPrice(order.totalAmount)}
                        </td>
                        {/* Status badge */}
                        <td className="px-5 py-3.5">
                          <Badge variant={ORDER_STATUS_BADGE[order.status] ?? "secondary"} className="text-[9px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-lg">
                            {ORDER_STATUS_EN[order.status] ?? order.status}
                          </Badge>
                        </td>
                        {/* Date */}
                        <td className="px-5 py-3.5 text-slate-550 font-semibold text-xs whitespace-nowrap">
                          {formatDate(order.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Logistics & Location Analytics Sub-Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Wilayas */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <h2 className="font-display text-sm font-bold text-slate-900">Top Wilayas (Algeria)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/20 text-[9px] uppercase tracking-wider text-slate-400 font-extrabold">
                      <th className="px-4 py-2.5">Wilaya</th>
                      <th className="px-4 py-2.5 text-center">Orders</th>
                      <th className="px-4 py-2.5 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 font-semibold text-slate-700">
                    {topWilayasEnriched.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No geographic data available.</td>
                      </tr>
                    ) : (
                      topWilayasEnriched.map((w: any) => (
                        <tr key={w.code} className="hover:bg-slate-50/30 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-800">{w.name}</td>
                          <td className="px-4 py-2.5 text-center font-mono font-bold text-slate-900">{w.count}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-950">{formatPrice(w.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Delivery Type distribution */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                <h2 className="font-display text-sm font-bold text-slate-900">Delivery Methods</h2>
              </div>
              
              <div className="space-y-4 font-medium">
                {(() => {
                  const total = deliveryTypeData.reduce((acc: number, cur: any) => acc + cur._count.id, 0) || 1;
                  const domicile = deliveryTypeData.find((d: any) => d.deliveryType === "DOMICILE")?._count.id ?? 0;
                  const stopdesk = deliveryTypeData.find((d: any) => d.deliveryType === "STOPDESK")?._count.id ?? 0;
                  
                  const domPct = Math.round((domicile / total) * 100);
                  const stopPct = Math.round((stopdesk / total) * 100);
                  
                  return (
                    <div className="space-y-4 text-xs">
                      {/* Domicile */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-bold">Home Delivery (Domicile)</span>
                          <span className="font-bold text-slate-950 font-mono">{domPct}% ({domicile} orders)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-900 rounded-full" style={{ width: `${domPct}%` }} />
                        </div>
                      </div>
                      
                      {/* Stopdesk */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-slate-700">
                          <span className="font-bold">Stop Desk (Agency pickup)</span>
                          <span className="font-bold text-slate-950 font-mono">{stopPct}% ({stopdesk} orders)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-[#C9A96E] rounded-full" style={{ width: `${stopPct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Staff Activity Timeline, Top Sold Products & Status Breakdown (1/3 width) */}
        <div className="space-y-6">
          
          {/* 1. Recent Staff Activity Timeline */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <History className="w-4 h-4 text-slate-400 shrink-0" />
              <h2 className="font-display text-sm font-bold text-slate-900">Staff Activity Feed</h2>
            </div>
            {staffActivity.length === 0 ? (
              <p className="px-5 py-12 text-slate-400 text-xs text-center font-medium italic">No recent staff actions registered.</p>
            ) : (
              <div className="p-5 space-y-4">
                <div className="relative border-l border-slate-100 pl-4 space-y-4 font-medium">
                  {staffActivity.map((activity: any) => (
                    <div key={activity.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className="absolute -left-[21px] top-1 bg-white border-2 border-slate-900 rounded-full w-2.5 h-2.5 shrink-0 animate-pulse" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800">{activity.changedBy?.name ?? "Staff"}</span>
                          <span className="text-[8px] px-1 py-0.2 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-wider font-extrabold scale-95">
                            {activity.changedBy?.role === "CONFIRMATRICE" ? "Confirmatrice" : "Admin"}
                          </span>
                        </div>
                        <p className="text-slate-600 font-semibold mt-0.5">
                          Updated <Link href={`/admin/orders/${activity.orderId}`} className="font-mono font-bold text-brand-900 hover:underline">{activity.order?.orderNumber}</Link> to <span className="uppercase font-bold tracking-wider text-[9px] bg-slate-50 px-1 py-0.2 rounded border text-slate-700">{activity.status.replace(/_/g, " ")}</span>
                        </p>
                        {activity.note && (
                          <p className="text-[10px] text-slate-450 italic mt-0.5 leading-relaxed bg-slate-50/70 p-1.5 rounded-lg border border-slate-100 border-dashed">
                            &ldquo;{activity.note}&rdquo;
                          </p>
                        )}
                        <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wider font-mono">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Top Selling Products */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
              <h2 className="font-display text-sm font-bold text-slate-900">Top sold products</h2>
            </div>
            {topProducts.length === 0 ? (
              <p className="px-5 py-12 text-slate-400 text-xs text-center font-medium italic">No sales registered.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {topProducts.map((tp: any, i: number) => (
                  <div key={tp.productId} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/30 transition-all">
                    <span className="text-xs text-slate-400 font-bold font-mono w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={tp.title}>{tp.title}</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-[#C9A96E] bg-[#C9A96E]/5 border border-[#C9A96E]/10 rounded-lg px-2.5 py-0.5 font-mono shrink-0 shadow-2xs">
                      {tp.qty} sold
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Order Status Breakdown counts */}
          <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-display text-sm font-bold text-slate-900">Order Status</h2>
            </div>
            
            <div className="p-5 space-y-4">
              {orderStatusBreakdown.length === 0 ? (
                <p className="text-slate-400 text-xs text-center font-medium italic">No orders registered.</p>
              ) : (
                orderStatusBreakdown.map(({ status, _count }: any) => {
                  const percentage = Math.min(100, Math.max(0, (_count.id / maxBreakdown) * 100));
                  return (
                    <div key={status} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge variant={ORDER_STATUS_BADGE[status] ?? "secondary"} className="text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-lg">
                          {ORDER_STATUS_EN[status] ?? status}
                        </Badge>
                        <span className="font-mono text-xs font-extrabold text-slate-900">
                          {_count.id} order{_count.id > 1 ? "s" : ""}
                        </span>
                      </div>
                      
                      {/* Luxury horizontal visual progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-800 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </div>
      </div>

    </div>
  );
}
