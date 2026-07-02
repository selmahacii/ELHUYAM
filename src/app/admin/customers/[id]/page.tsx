import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const STATUS_BADGE_MAP: Record<string, "warning" | "info" | "success" | "destructive" | "luxury" | "secondary"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PROCESSING: "info",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  CANCELLED: "destructive",
  REFUNDED: "luxury",
};
import Link from "next/link";
import CustomerActions from "./customer-actions";
import CustomerPasswordReset from "./customer-password-reset";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await db.user.findUnique({
    where: { id },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 10, include: { items: { select: { quantity: true } } } },
      addresses: true,
      _count: { select: { orders: true, reviews: true, wishlistItems: true } },
    },
  });
  if (!customer) notFound();

  const totalSpent = await db.order.aggregate({
    where: { userId: id, paymentStatus: "PAID" },
    _sum: { totalAmount: true },
  });

  const actionLogs = (customer.role === "CONFIRMATRICE" || customer.role === "ADMIN")
    ? await db.orderStatusHistory.findMany({
        where: { changedById: id },
        include: { order: { select: { orderNumber: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href="/admin/customers" className="text-xs text-brand-400 hover:text-brand-700 uppercase tracking-widest">← Customers</Link>
        <div className="flex items-start justify-between mt-2 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-2xl text-brand-900">{customer.name ?? "—"}</h1>
            <p className="text-brand-400 text-sm">{customer.email}</p>
          </div>
          <CustomerActions customer={{ id: customer.id, isBanned: customer.isBanned, name: customer.name ?? "" }} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: customer._count.orders },
          { label: "Total Spent", value: formatPrice(totalSpent._sum.totalAmount ?? 0) },
          { label: "Reviews", value: customer._count.reviews },
          { label: "Wishlist", value: customer._count.wishlistItems },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-brand-100 p-4">
            <p className="font-display text-xl text-brand-900">{value}</p>
            <p className="text-xs uppercase tracking-widest text-brand-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Action Traceability Log for Confirmatrice / Admin */}
          {(customer.role === "CONFIRMATRICE" || customer.role === "ADMIN") && (
            <div className="bg-white border border-brand-100 shadow-sm">
              <div className="px-5 py-4 border-b border-brand-100 flex items-center justify-between bg-zinc-50/50">
                <h2 className="font-display text-sm font-bold uppercase tracking-widest text-zinc-800">
                  Traçabilité des Actions ({actionLogs.length})
                </h2>
                <span className="bg-blue-50 text-blue-800 text-[10px] uppercase font-extrabold tracking-widest px-2.5 py-0.5 border border-blue-200">
                  Journal d'Audit
                </span>
              </div>
              {actionLogs.length === 0 ? (
                <p className="px-5 py-10 text-zinc-400 text-sm text-center">Aucune action enregistrée pour le moment.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 bg-zinc-50/30">
                        {["Date & Heure", "Commande", "Nouvel État", "Note / Détails"].map((h) => (
                          <th key={h} className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-zinc-400 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150">
                      {actionLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3 text-xs font-mono text-zinc-500 whitespace-nowrap">
                            {formatDateTime(log.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            {log.order ? (
                              <Link href={`/admin/orders/${log.orderId}`} className="font-mono text-xs font-semibold text-brand-600 hover:text-brand-900 hover:underline">
                                {log.order.orderNumber}
                              </Link>
                            ) : (
                              <span className="text-xs text-zinc-400 font-mono">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={STATUS_BADGE_MAP[log.status] ?? "secondary"} className="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5">
                              {log.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-600 max-w-[280px] truncate" title={log.note ?? ""}>
                            {log.note ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-brand-100">
            <h2 className="font-display text-base text-brand-900 px-5 py-4 border-b border-brand-100">Recent Orders</h2>
            {customer.orders.length === 0 ? (
              <p className="px-5 py-8 text-brand-400 text-sm">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-50 bg-brand-50">
                    {["Order", "Items", "Total", "Status", "Date"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs uppercase tracking-widest text-brand-400 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-50">
                  {customer.orders.map((order: (typeof customer.orders)[number]) => (
                    <tr key={order.id} className="hover:bg-brand-50">
                      <td className="px-4 py-2.5">
                        <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs font-medium text-brand-700 hover:text-brand-900">{order.orderNumber}</Link>
                      </td>
                      <td className="px-4 py-2.5 text-brand-600">{order.items.reduce((s: number, i: (typeof order.items)[number]) => s + i.quantity, 0)}</td>
                      <td className="px-4 py-2.5 font-medium text-brand-900">{formatPrice(order.totalAmount)}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant={order.status === "DELIVERED" ? "success" : order.status === "CANCELLED" ? "destructive" : "info"}>
                          {order.status.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-brand-400">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white border border-brand-100 p-5">
            <h3 className="font-display text-base text-brand-900 mb-3">Account Details</h3>
            <dl className="space-y-2 text-sm">
              <div><dt className="text-xs text-brand-400 uppercase tracking-widest">Joined</dt><dd className="text-brand-700 mt-0.5">{formatDate(customer.createdAt)}</dd></div>
              <div><dt className="text-xs text-brand-400 uppercase tracking-widest">Phone</dt><dd className="text-brand-700 mt-0.5">{customer.phone ?? "—"}</dd></div>
              <div><dt className="text-xs text-brand-400 uppercase tracking-widest">Status</dt><dd className="mt-0.5">{customer.isBanned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="success">Active</Badge>}</dd></div>
            </dl>
          </div>

          <CustomerPasswordReset userId={customer.id} />

          {customer.addresses.length > 0 && (
            <div className="bg-white border border-brand-100 p-5">
              <h3 className="font-display text-base text-brand-900 mb-3">Addresses</h3>
              <div className="space-y-3">
                {customer.addresses.map((addr: (typeof customer.addresses)[number]) => (
                  <address key={addr.id} className="not-italic text-xs text-brand-600 leading-relaxed">
                    <p className="font-medium text-brand-900">{addr.label} {addr.isDefault && <span className="text-brand-400">(Default)</span>}</p>
                    <p>{addr.firstName} {addr.lastName}</p>
                    <p>{addr.street}, {addr.city}</p>
                    <p>{addr.country}</p>
                  </address>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
