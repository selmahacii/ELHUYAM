export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import nextDynamic from "next/dynamic";
const ManualOrderModal = nextDynamic(() => import("./manual-order-modal"));
import { auth } from "@/auth";
import OrderRow from "./order-row";
import { 
  Package, 
  Search, 
  Filter, 
  X, 
  TrendingUp, 
  AlertTriangle, 
  Clock
} from "lucide-react";
import { subDays, startOfDay } from "date-fns";

interface SearchParams { 
  searchParams: Promise<{ status?: string; search?: string; page?: string; period?: string; type?: string }> 
}

export default async function AdminOrdersPage({ searchParams }: SearchParams) {
  const session = await auth();
  const role = session?.user?.role;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const now = new Date();
  const periodDate = 
    sp.period === "day" ? startOfDay(now) :
    sp.period === "week" ? startOfDay(subDays(now, 7)) :
    sp.period === "month" ? startOfDay(subDays(now, 30)) :
    undefined;

  const where = {
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(sp.type === "national" ? { isInternational: false } : sp.type === "international" ? { isInternational: true } : {}),
    ...(periodDate ? { createdAt: { gte: periodDate } } : {}),
    ...(sp.search ? {
      OR: [
        { orderNumber: { contains: sp.search } },
        { user: { name: { contains: sp.search } } },
        { user: { email: { contains: sp.search } } },
        { shippingPhone: { contains: sp.search } },
      ],
    } : {}),
  };

  const [orders, total, statusCounts, totalRevenueResult] = await Promise.all([
    db.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          select: {
            quantity: true,
            productTitle: true,
            productImage: true,
            size: true,
            color: true,
            product: { select: { images: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.order.count({ where }),
    // Count per status for tab badges
    Promise.all(
      ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"].map((s) =>
        db.order.count({ where: { ...where, status: s as never } })
      )
    ),
    db.order.aggregate({
      where: { ...where, status: "DELIVERED" },
      _sum: { totalAmount: true },
    }),
  ]);

  const [
    pendingCount,
    confirmedCount,
    processingCount,
    shippedCount,
    outForDeliveryCount,
    deliveredCount,
    cancelledCount,
    refundedCount
  ] = statusCounts;
  const totalPages = Math.ceil(total / limit);
  const totalRevenue = totalRevenueResult._sum.totalAmount ?? 0;

  const tabs = [
    { label: "Tous", status: null, count: total, color: "slate" },
    { label: "⏳ En attente", status: "PENDING", count: pendingCount, color: "amber" },
    { label: "✓ Confirmés", status: "CONFIRMED", count: confirmedCount, color: "blue" },
    { label: "📦 En préparation", status: "PROCESSING", count: processingCount, color: "indigo" },
    { label: "🚚 Expédiés", status: "SHIPPED", count: shippedCount, color: "purple" },
    { label: "🛵 En livraison", status: "OUT_FOR_DELIVERY", count: outForDeliveryCount, color: "yellow" },
    { label: "🎉 Livrés", status: "DELIVERED", count: deliveredCount, color: "emerald" },
    { label: "✕ Annulés", status: "CANCELLED", count: cancelledCount, color: "red" },
    { label: "↩ Retournés", status: "REFUNDED", count: refundedCount, color: "rose" },
  ];

  const buildLink = (status: string | null, p?: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (sp.search) params.set("search", sp.search);
    if (sp.period) params.set("period", sp.period);
    if (sp.type) params.set("type", sp.type);
    if (p) params.set("page", String(p));
    return `/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
  };

  const buildTypeLink = (type: string | null) => {
    const params = new URLSearchParams();
    if (sp.status) params.set("status", sp.status);
    if (sp.search) params.set("search", sp.search);
    if (sp.period) params.set("period", sp.period);
    if (type) params.set("type", type);
    return `/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Header Area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">
            Order Tracking
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            View invoices, update package status, and record manual sales.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {pendingCount > 0 && (
            <Link 
              href="/admin/orders?status=PENDING" 
              className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-amber-100/50 transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{pendingCount} pending order{pendingCount > 1 ? "s" : ""}</span>
            </Link>
          )}
          <ManualOrderModal />
        </div>
      </div>

      {/* ── Order Metrics Cards Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Orders */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Orders Count</p>
            <h3 className="text-xl font-bold text-slate-900">{total}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Action Pending */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">To Confirm</p>
            <h3 className="text-xl font-bold text-amber-600">{pendingCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Chiffre d'Affaires Livré */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Revenue (Delivered)</p>
            <h3 className="text-xl font-bold text-brand-900">{formatPrice(totalRevenue)}</h3>
          </div>
          <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-900">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Search Bar Form ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <form method="GET" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              name="search"
              defaultValue={sp.search}
              placeholder="Search by order N°, client name, email or phone..."
              className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10 font-medium"
            />
            {sp.status && <input type="hidden" name="status" value={sp.status} />}
            {sp.period && <input type="hidden" name="period" value={sp.period} />}
          </div>

          {/* Period selector */}
          <div className="flex gap-1 bg-slate-100/70 p-1 border border-slate-200/50 rounded-2xl shrink-0 text-xs items-center h-10 font-bold">
            {[
              { value: "all", label: "All Time" },
              { value: "day", label: "Today" },
              { value: "week", label: "7 Days" },
              { value: "month", label: "30 Days" }
            ].map((p) => {
              const isActive = (p.value === "all" && !sp.period) || sp.period === p.value;
              const linkParams = new URLSearchParams();
              if (sp.status) linkParams.set("status", sp.status);
              if (sp.search) linkParams.set("search", sp.search);
              if (p.value !== "all") linkParams.set("period", p.value);
              const href = `/admin/orders${linkParams.toString() ? `?${linkParams.toString()}` : ""}`;

              return (
                <Link
                  key={p.value}
                  href={href}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-950"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </div>

          <div className="flex gap-2 shrink-0">
            <button 
              type="submit" 
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm transition-all h-10"
            >
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            {(sp.search || sp.period) && (
              <Link 
                href={buildLink(sp.status ?? null)} 
                className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-600 rounded-xl transition-all h-10 bg-white shadow-sm"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* ── Type & Status Navigation ──────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {[
            { label: "Toutes (All)", type: null },
            { label: "Nationales", type: "national" },
            { label: "Internationales", type: "international" },
          ].map(({ label, type }) => {
            const isActive = (type === null && !sp.type) || sp.type === type;
            return (
              <Link
                key={label}
                href={buildTypeLink(type)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white border-gray-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <div className="flex gap-2 flex-wrap pb-2 border-b border-gray-200">
          {tabs.map(({ label, status, count, color }) => {
            const isActive = (status === null && !sp.status) || sp.status === status;
            
            // Map color classes
            const colorClasses = 
              !isActive ? "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border-gray-200" :
              color === "amber" ? "bg-amber-50 text-amber-800 border-amber-300 shadow-sm" :
              color === "blue" ? "bg-blue-50 text-blue-800 border-blue-300 shadow-sm" :
              color === "indigo" ? "bg-indigo-50 text-indigo-800 border-indigo-300 shadow-sm" :
              color === "purple" ? "bg-purple-50 text-purple-800 border-purple-300 shadow-sm" :
              color === "yellow" ? "bg-yellow-50 text-yellow-800 border-yellow-300 shadow-sm" :
              color === "emerald" ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-sm" :
              color === "red" ? "bg-red-50 text-red-800 border-red-300 shadow-sm" :
              color === "rose" ? "bg-rose-50 text-rose-800 border-rose-300 shadow-sm" :
              "bg-slate-900 text-white border-slate-950 shadow-sm";

            return (
              <Link
                key={label}
                href={buildLink(status)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${colorClasses}`}
              >
                <span>{label}</span>
                {count !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive 
                      ? "bg-white/90 text-slate-900" 
                      : "bg-slate-200/60 text-slate-655"
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Table Container ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {["Visual", "Order N°", "Customer", "Items", "Amount", "Payment", "Status", "Date", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300">
                        <Package className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">No orders found.</p>
                    </div>
                  </td>
                </tr>
              )}
              {orders.map((order: any) => (
                <OrderRow key={order.id} order={order} role={role} />
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{skip + 1}</span> to <span className="font-bold text-slate-900">{Math.min(skip + limit, total)}</span> of <span className="font-bold text-slate-900">{total}</span> orders
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link 
                  href={buildLink(sp.status ?? null, page - 1)} 
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-white text-slate-600 flex items-center justify-center transition-all bg-slate-50 shadow-sm"
                >
                  ‹
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="w-8 h-8 flex items-center justify-center text-slate-300 text-xs">…</span>
                    )}
                    <Link
                      href={buildLink(sp.status ?? null, p)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        p === page 
                          ? "bg-slate-900 text-white border border-slate-900" 
                          : "border border-gray-200 hover:bg-white text-slate-600 bg-slate-50/50"
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              {page < totalPages && (
                <Link 
                  href={buildLink(sp.status ?? null, page + 1)} 
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-white text-slate-600 flex items-center justify-center transition-all bg-slate-50 shadow-sm"
                >
                  ›
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
