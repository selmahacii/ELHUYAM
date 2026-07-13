import { db } from "@/lib/db";
import { formatPrice } from "@/lib/utils";
import { subDays, startOfDay, format } from "date-fns";
import Link from "next/link";
import nextDynamic from "next/dynamic";
// recharts (+ its d3-* deps) is a sizeable client bundle — code-split it into
// its own chunk instead of bundling it eagerly into the analytics route.
const AnalyticsCharts = nextDynamic(() => import("./analytics-charts"));
import {
  TrendingUp, TrendingDown, Minus, Coins, ShoppingBag, Users, 
  Package, AlertTriangle, ArrowRight, Star
} from "lucide-react";

interface SearchParams { searchParams: Promise<{ period?: string }> }

export default async function AdminAnalyticsPage({ searchParams }: SearchParams) {
  const sp = await searchParams;
  const period = Math.min(Math.max(Number(sp.period ?? 30), 7), 365);
  const from = startOfDay(subDays(new Date(), period));
  const prevFrom = subDays(from, period);

  const [
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    periodAgg,
    prevAgg,
    revenueData,
    orderStatusBreakdown,
    topProducts,
    lowStockProducts,
  ] = await Promise.all([
    db.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { totalAmount: true } }),
    db.order.count(),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.product.count({ where: { archived: false } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.aggregate({ where: { createdAt: { gte: from }, paymentStatus: "PAID" }, _sum: { totalAmount: true }, _count: { id: true } }),
    db.order.aggregate({ where: { createdAt: { gte: prevFrom, lt: from }, paymentStatus: "PAID" }, _sum: { totalAmount: true }, _count: { id: true } }),
    db.order.groupBy({ by: ["createdAt"], where: { createdAt: { gte: from }, paymentStatus: "PAID" }, _sum: { totalAmount: true }, _count: { id: true } }),
    db.order.groupBy({ by: ["status"], _count: { id: true } }),
    db.orderItem.groupBy({ by: ["productId"], _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
    db.product.findMany({ where: { archived: false, stock: { lte: 5 } }, select: { id: true, title: true, stock: true }, orderBy: { stock: "asc" }, take: 8 }),
  ]);

  // Enrich top products
  const productIds = topProducts.map((p: any) => p.productId);
  const productDetails = await db.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, title: true, price: true, images: true, slug: true },
  });
  
  const topProductsEnriched = topProducts.map((tp: any) => ({
    productId: tp.productId,
    quantity: tp._sum.quantity ?? 0,
    product: productDetails.find((p: any) => p.id === tp.productId),
  }));

  // Build revenue chart
  const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
  for (let i = period; i >= 0; i--) {
    revenueByDay[format(subDays(new Date(), i), "yyyy-MM-dd")] = { revenue: 0, orders: 0 };
  }
  for (const row of revenueData) {
    const day = format(new Date(row.createdAt), "yyyy-MM-dd");
    if (revenueByDay[day]) {
      revenueByDay[day].revenue += Number(row._sum.totalAmount ?? 0);
      revenueByDay[day].orders += row._count.id;
    }
  }
  const revenueChart = Object.entries(revenueByDay).map(([date, val]) => ({ date, ...val }));

  const pRevenue = Number(periodAgg._sum.totalAmount ?? 0);
  const prevRevenue = Number(prevAgg._sum.totalAmount ?? 0);
  const revenueChange = prevRevenue > 0 ? ((pRevenue - prevRevenue) / prevRevenue) * 100 : 0;
  const ordersChange = prevAgg._count.id > 0 ? ((periodAgg._count.id - prevAgg._count.id) / prevAgg._count.id) * 100 : 0;

  function TrendIcon({ value }: { value: number }) {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 animate-bounce" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-rose-500 shrink-0" />;
    return <Minus className="w-4 h-4 text-slate-400 shrink-0" />;
  }

  const kpis = [
    { 
      label: "Revenue", 
      value: formatPrice(Number(totalRevenue._sum.totalAmount ?? 0)), 
      sub: `${formatPrice(pRevenue)} this period`, 
      change: revenueChange,
      icon: Coins,
      iconClass: "bg-emerald-50 text-emerald-600 border-emerald-100"
    },
    { 
      label: "Orders", 
      value: totalOrders, 
      sub: `${periodAgg._count.id} this period`, 
      change: ordersChange,
      icon: ShoppingBag,
      iconClass: "bg-sky-50 text-sky-600 border-sky-100"
    },
    { 
      label: "Registered Customers", 
      value: totalCustomers, 
      sub: "Registered accounts", 
      change: null,
      icon: Users,
      iconClass: "bg-purple-50 text-purple-600 border-purple-100"
    },
    { 
      label: "Active Products", 
      value: totalProducts, 
      sub: `${pendingOrders} pending confirmation`, 
      change: null,
      icon: Package,
      iconClass: "bg-amber-50 text-amber-600 border-amber-100"
    },
  ];

  const periods = [
    { value: 1, label: "Today" },
    { value: 7, label: "Week" },
    { value: 30, label: "Month" },
    { value: 90, label: "Quarter" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            View sales charts, catalog performance, and manage logistics alerts.
          </p>
        </div>
        
        {/* Period selection list as sleek gold pills */}
        <div className="flex gap-1.5 bg-slate-100/70 p-1 border border-slate-200/50 rounded-2xl shrink-0">
          {periods.map((p) => {
            const isActive = period === p.value;
            return (
              <Link 
                key={p.value} 
                href={`?period=${p.value}`}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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

      {/* ── KPI Grid Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, change, icon: Icon, iconClass }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow flex flex-col justify-between min-h-[140px]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">{label}</p>
                <h3 className="font-display text-xl sm:text-2xl text-slate-950 font-bold tracking-tight mt-1">{value}</h3>
              </div>
              <div className={`p-2.5 border rounded-xl shrink-0 ${iconClass}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            
            <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-3">
              <p className="text-[11px] text-slate-500 font-medium">{sub}</p>
              {change !== null && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 rounded-lg px-2 py-0.5">
                  <TrendIcon value={change} />
                  <span className={`text-[10px] font-bold font-mono ${change > 0 ? "text-emerald-600" : change < 0 ? "text-rose-600" : "text-slate-400"}`}>
                    {change > 0 ? "+" : ""}{Math.round(change * 10) / 10}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Visual Charts ── */}
      <AnalyticsCharts
        revenueChart={revenueChart}
        orderStatusBreakdown={orderStatusBreakdown.map((s: any) => ({ status: s.status, count: s._count.id }))}
      />

      {/* ── Lists & Tables Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Products */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span>Top Selling Products</span>
              <span className="text-[10px] bg-slate-100 border border-slate-200/50 text-slate-500 font-bold px-2 py-0.5 rounded-lg">Top 5</span>
            </h2>
            {topProductsEnriched.length === 0 ? (
              <p className="px-5 py-12 text-slate-400 text-xs text-center font-medium italic">No sales recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topProductsEnriched.map((tp: any, i: number) => (
                  <div key={tp.productId} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/30 transition-all duration-150">
                    <span className="text-xs text-slate-400 font-bold font-mono w-4">{i + 1}</span>
                    
                    {/* Visual thumbnail */}
                    {tp.product?.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tp.product.images[0]} alt="" className="w-8 h-10 object-cover bg-slate-100 rounded-lg shrink-0 border border-slate-200/30 shadow-2xs" />
                    ) : (
                      <div className="w-8 h-10 bg-slate-50 border border-slate-200/40 rounded-lg flex items-center justify-center text-slate-350 shrink-0">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate" title={tp.product?.title}>{tp.product?.title ?? "Deleted product"}</p>
                      <p className="text-[10px] text-brand-900 font-extrabold">{tp.quantity} unit{tp.quantity > 1 ? "s" : ""} sold</p>
                    </div>
                    
                    <p className="text-xs font-bold text-slate-900 shrink-0 font-mono">
                      {formatPrice(Number(tp.product?.price ?? 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-slate-900 px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span>Critical Stock Alerts</span>
              <span className="text-[10px] bg-rose-50 border border-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500 animate-pulse" />
                Warning
              </span>
            </h2>
            {lowStockProducts.length === 0 ? (
              <p className="px-5 py-12 text-slate-400 text-xs text-center font-medium italic">All catalog items are well stocked.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {lowStockProducts.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/30 transition-all duration-150">
                    <div className="min-w-0 flex-1 pr-4">
                      <Link href={`/admin/products`} className="text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-900 truncate block hover:underline underline-offset-2">
                        {p.title}
                      </Link>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-lg shadow-2xs ${p.stock === 0 ? "bg-red-50 text-red-700 border border-red-100" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                        {p.stock === 0 ? "Out of stock" : `${p.stock} remaining`}
                      </span>
                      <Link 
                        href="/admin/products"
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        title="Restock in inventory"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
