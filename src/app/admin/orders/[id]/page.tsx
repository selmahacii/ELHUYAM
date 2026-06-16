import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, formatPrice, formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import OrderActions from "./order-actions";
import ZRTracking from "./zr-tracking";
import { auth } from "@/auth";
import { Package, User, MapPin, ClipboardList, Calendar, FileText } from "lucide-react";

type Props = { params: Promise<{ id: string }> };

const STATUS_BADGE: Record<string, "warning" | "info" | "success" | "destructive" | "luxury" | "secondary"> = {
  PENDING: "warning", CONFIRMED: "info", PROCESSING: "info",
  SHIPPED: "info", OUT_FOR_DELIVERY: "info", DELIVERED: "success",
  CANCELLED: "destructive", REFUNDED: "luxury",
};

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: true,
              stock: true,
              variants: {
                select: {
                  size: true,
                  color: true,
                  stock: true,
                }
              }
            }
          }
        }
      },
      statusHistory: {
        orderBy: { createdAt: "asc" },
        include: { changedBy: { select: { id: true, name: true, role: true } } }
      },
      coupon: { select: { code: true } },
    },
  });
  if (!order) notFound();

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 md:px-0">
      
      {/* ── Top Header Section ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/60 pb-4">
        <div>
          <Link 
            href="/admin/orders" 
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-950 uppercase tracking-widest transition-colors mb-1.5"
          >
            <span>←</span> Back to orders
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-display text-xl font-bold tracking-tight text-zinc-900">{order.orderNumber}</h1>
            <div className="flex items-center gap-1.5">
              <Badge variant={STATUS_BADGE[order.status] ?? "secondary"} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                {order.status.replace(/_/g, " ")}
              </Badge>
              <Badge variant={order.paymentStatus === "PAID" ? "success" : order.paymentStatus === "FAILED" ? "destructive" : "warning"} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5">
                {order.paymentStatus}
              </Badge>
            </div>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-zinc-300" />
            Created on {formatDate(order.createdAt)}
          </p>
        </div>
      </div>

      {/* ── Main Responsive Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side (2/3 width) — Products, Timeline & Client Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Row 1: Side-by-side Articles & Timeline for maximum height compression */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            
            {/* 1. Products List Card with fixed height scroll */}
            <div className="bg-white border border-zinc-200/80 shadow-sm rounded-sm flex flex-col overflow-hidden h-[340px]">
              <div className="px-4 py-3 bg-zinc-50/50 border-b border-zinc-150 flex items-center justify-between shrink-0">
                <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-700 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-zinc-400" />
                  Items ({order.items.length})
                </h2>
              </div>
              <div className="divide-y divide-zinc-100 overflow-y-auto flex-1 pr-0.5">
                {order.items.map((item: (typeof order.items)[number]) => (
                  <div key={item.id} className="flex gap-3 p-4 hover:bg-zinc-50/20 transition-colors">
                    {(item.productImage ?? item.product?.images?.[0]) ? (
                      <Link
                        href={item.product?.slug ? `/shop/${item.product.slug}` : "/shop"}
                        target="_blank"
                        className="w-10 h-14 rounded-sm border border-zinc-200 bg-zinc-100 relative overflow-hidden shrink-0 shadow-sm block group"
                      >
                        <Image
                          src={item.productImage ?? item.product?.images?.[0]!}
                          alt={item.productTitle}
                          fill
                          sizes="40px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    ) : (
                      <div className="w-10 h-14 rounded-sm border border-zinc-250 bg-zinc-50 flex items-center justify-center shrink-0 text-zinc-400">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-zinc-900 text-xs truncate" title={item.productTitle}>{item.productTitle}</p>
                        {(() => {
                          const variants = item.product?.variants ?? [];
                          let currentStock = 0;
                          let resolved = false;

                          if (variants.length > 0 && (item.size || item.color)) {
                            const exact = variants.find((v: any) => v.size === item.size && v.color === item.color);
                            if (exact) {
                              currentStock = exact.stock;
                              resolved = true;
                            } else {
                              const partial = variants.find((v: any) => {
                                const sizeOk = item.size ? v.size === item.size : true;
                                const colorOk = item.color ? v.color === item.color : true;
                                return sizeOk && colorOk;
                              });
                              if (partial) {
                                currentStock = partial.stock;
                                resolved = true;
                              }
                            }
                          }

                          if (!resolved) {
                            currentStock = item.product?.stock ?? 0;
                          }

                          if (currentStock === 0) {
                            return (
                              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-red-50 text-red-650 border border-red-200 uppercase tracking-wide">
                                Out of stock
                              </span>
                            );
                          }
                          if (currentStock <= 5) {
                            return (
                              <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                                Low Stock ({currentStock})
                              </span>
                            );
                          }
                          return (
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-50/70 text-emerald-700 border border-emerald-200/80 uppercase tracking-wide">
                              {currentStock} in stock
                            </span>
                          );
                        })()}
                      </div>
                      
                      {/* Item Variants tags */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.size && (
                          <span className="bg-zinc-100 text-zinc-700 px-1 py-0.2 text-[8px] uppercase font-bold tracking-wider rounded-sm">
                            S: {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span className="bg-zinc-100 text-zinc-700 px-1 py-0.2 text-[8px] uppercase font-bold tracking-wider rounded-sm">
                            C: {item.color}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
                        {item.quantity} x {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-zinc-900 shrink-0 text-xs font-mono self-start pt-0.5">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Order Timeline Card with matched height scroll */}
            <div className="bg-white border border-zinc-200/80 shadow-sm rounded-sm flex flex-col overflow-hidden h-[340px]">
              <div className="px-4 py-3 bg-zinc-50/50 border-b border-zinc-150 shrink-0">
                <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-700">
                  Order history
                </h2>
              </div>
              <div className="p-4 overflow-y-auto flex-1 pr-0.5">
                <div className="relative border-l border-zinc-200 ml-2 pl-4 space-y-4 py-1">
                  {order.statusHistory.map((h: (typeof order.statusHistory)[number]) => (
                    <div key={h.id} className="relative">
                      {/* Visual dot indicator */}
                      <span className="absolute -left-[23px] top-1 bg-white border-2 border-zinc-900 rounded-full w-2.5 h-2.5 flex items-center justify-center" />
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-zinc-950 uppercase tracking-wider">
                            {h.status.replace(/_/g, " ")}
                          </span>
                          {(h as any).changedBy && (
                            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-zinc-100 text-zinc-600 rounded-sm border border-zinc-200 uppercase tracking-wider">
                              By {(h as any).changedBy.name} ({(h as any).changedBy.role === "CONFIRMATRICE" ? "Confirmatrice" : "Admin"})
                            </span>
                          )}
                        </div>
                        {h.note && (
                          <p className="text-[10px] text-zinc-500 mt-0.5 italic bg-zinc-50/80 p-1.5 border border-zinc-100 rounded-sm inline-block">
                            "{h.note}"
                          </p>
                        )}
                        <p className="text-[9px] text-zinc-400 mt-1 font-mono">{formatDateTime(h.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Row 2: Customer & Shipping Details grouped horizontally */}
          <div className="bg-white border border-zinc-200/80 shadow-sm rounded-sm overflow-hidden">
            <div className="px-4 py-3 bg-zinc-50/50 border-b border-zinc-150">
              <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                Customer & Delivery Information
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-150">
              
              {/* Left Side: Customer Info */}
              <div className="space-y-4 pb-4 md:pb-0">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Customer Profile</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-250 flex items-center justify-center text-xs font-bold text-zinc-800 uppercase shrink-0">
                    {order.user?.name ? order.user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2) : <User className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{order.user?.name || "Guest Customer"}</p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">{order.user?.email || "No email address"}</p>
                  </div>
                </div>

                {order.user?.id && (
                  <Link 
                    href={`/admin/customers/${order.user.id}`} 
                    className="inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-950 border border-zinc-200 px-4 py-2 rounded-sm bg-zinc-50/50 hover:bg-zinc-50 transition-colors w-full text-center"
                  >
                    View Customer Profile ↗
                  </Link>
                )}
              </div>

              {/* Right Side: Shipping details */}
              <div className="space-y-3 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Shipping Address</h3>
                  {order.deliveryType && (
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                      order.deliveryType === "STOPDESK"
                        ? "bg-blue-50 text-blue-700 border border-blue-150"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-150"
                    }`}>
                      {order.deliveryType === "STOPDESK" ? "Stop desk" : "Home delivery"}
                    </span>
                  )}
                </div>
                <address className="not-italic text-xs text-zinc-650 space-y-1">
                  <p className="font-semibold text-zinc-900 text-sm mb-1">{order.shippingFirstName} {order.shippingLastName}</p>
                  {order.shippingPhone && (
                    <p className="font-semibold text-zinc-800 flex items-center gap-1.5">
                      <span className="text-[10px] text-zinc-400 font-normal">Phone:</span> {order.shippingPhone}
                    </p>
                  )}
                  {order.shippingStreet && <p className="text-zinc-500">{order.shippingStreet}</p>}
                  <p className="text-zinc-700 font-medium">
                    {order.shippingState ?? order.shippingCity}{order.wilayaCode ? ` (${order.wilayaCode})` : ""}
                  </p>
                  <p className="text-zinc-400 text-[10px] uppercase tracking-wider">{order.shippingCountry ?? "Algeria"}</p>
                </address>
              </div>

            </div>
          </div>

          {/* 3. Customer Notes */}
          {order.notes && order.notes.trim() !== "" && (
            <div className="bg-amber-50/30 border border-amber-200/60 shadow-sm rounded-sm overflow-hidden transition-all duration-300 hover:shadow-md">
              <div className="px-4 py-3 bg-amber-50/70 border-b border-amber-200/40 flex items-center justify-between">
                <h2 className="font-display text-[10px] font-bold uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  Customer Note
                </h2>
                <span className="bg-amber-100/80 border border-amber-200 text-amber-800 text-[8px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full">
                  Instructions
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-zinc-800 font-semibold leading-relaxed whitespace-pre-wrap italic">
                  "{order.notes}"
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Right Side (1/3 width) — Actions, ZR tracking, Financial Invoice summary */}
        <div className="space-y-6">
          
          {/* 1. Quick Actions Box */}
          <OrderActions order={order} role={role} />

          {/* 2. ZR Express Live Tracking Panel */}
          {order.trackingNumber && order.carrier === "ZR_EXPRESS" && (
            <ZRTracking trackingNumber={order.trackingNumber} />
          )}

          {/* 3. Financial Invoice Summary */}
          <div className="bg-white border border-zinc-200/80 shadow-sm rounded-sm p-4 space-y-3">
            <h3 className="font-display text-[10px] font-bold uppercase tracking-widest text-zinc-700 border-b border-zinc-100 pb-2">
              Financial summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-zinc-500">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span className="font-mono">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-zinc-500 border-t border-dashed border-zinc-150 pt-1.5 font-medium">
                <span>Basket Total (Excl. Shipping)</span>
                <span className="font-mono">{formatPrice(order.subtotal - order.discount)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Shipping fee</span>
                <span className="font-mono">{order.shippingFee === 0 ? "Free" : formatPrice(order.shippingFee)}</span>
              </div>
            </div>
            
            <div className="flex justify-between font-bold text-zinc-900 text-xs border-t border-zinc-150 pt-2.5">
              <span>Total (Incl. Shipping)</span>
              <span className="text-sm text-zinc-950 font-mono">{formatPrice(order.totalAmount)}</span>
            </div>
            
            <div className="text-[10px] text-zinc-400 bg-zinc-50 p-2 border border-zinc-100 rounded-sm font-mono text-center">
              Payment method: <span className="font-semibold text-zinc-700">{order.paymentMethod?.toUpperCase() ?? "NOT SPECIFIED"}</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
