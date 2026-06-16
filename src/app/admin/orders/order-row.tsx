"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, Package, Layers, User, Phone } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate, formatPrice } from "@/lib/utils";

interface OrderItem {
  quantity: number;
  productTitle: string;
  productImage?: string | null;
  product?: {
    images: string[];
    slug?: string | null;
  } | null;
}

interface OrderRowProps {
  order: {
    id: string;
    orderNumber: string;
    createdAt: Date;
    totalAmount: number;
    subtotal: number;
    discount: number;
    paymentStatus: string;
    status: string;
    user?: {
      name: string | null;
      email: string | null;
      phone?: string | null;
    } | null;
    items: OrderItem[];
    shippingPhone?: string | null;
    shippingFirstName?: string | null;
    shippingLastName?: string | null;
    notes?: string | null;
    trackingNumber?: string | null;
    carrier?: string | null;
    hasReturnedOrders?: boolean;
  };
  role?: string;
}

const ORDER_STATUSES = [
  { value: "PENDING",          label: "Pending" },
  { value: "CONFIRMED",        label: "Confirmed" },
  { value: "PROCESSING",       label: "Processing" },
  { value: "SHIPPED",          label: "Shipped" },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED",        label: "Delivered" },
  { value: "CANCELLED",        label: "Cancelled" },
  { value: "REFUNDED",         label: "Refunded" },
];

export default function OrderRow({ order, role }: OrderRowProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [updating, setUpdating] = useState(false);

  const items = order.items;
  const isMultiProduct = items.length > 1;

  // Compute total quantity
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  // Compile list of titles for tooltip
  const itemsTooltip = items
    .map((item) => `${item.productTitle} (Qté: ${item.quantity})`)
    .join("\n");

  // Status badge styling classes (French translation coherent color codes)
  const statusStyles =
    status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20" :
    status === "CANCELLED" || status === "REFUNDED" ? "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20" :
    status === "PENDING" ? "bg-amber-50/70 text-amber-700 border-amber-200 focus:ring-amber-500/20" :
    "bg-sky-50 text-sky-700 border-sky-200 focus:ring-sky-500/20";

  // Payment badge styling classes
  const paymentStyles =
    paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20" :
    paymentStatus === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20" :
    "bg-amber-50/70 text-amber-700 border-amber-200 focus:ring-amber-500/20";

  // Quick Action: Update Status
  async function handleStatusChange(newStatus: string) {
    if (newStatus === status) return;
    setUpdating(true);

    // Auto-settle payment to PAID when order is DELIVERED
    const nextPaymentStatus = newStatus === "DELIVERED" ? "PAID" : paymentStatus;

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: nextPaymentStatus,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Failed to update");
        return;
      }

      setStatus(newStatus);
      if (newStatus === "DELIVERED") {
        setPaymentStatus("PAID");
      }
      toast.success("Order status updated");
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setUpdating(false);
    }
  }

  // Quick Action: Update Payment Status
  async function handlePaymentStatusChange(newPaymentStatus: string) {
    if (newPaymentStatus === paymentStatus) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: newPaymentStatus,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Failed to update payment status");
        return;
      }

      setPaymentStatus(newPaymentStatus);
      toast.success("Payment status updated");
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setUpdating(false);
    }
  }

  // Check if it's a guest customer or registered user
  const isGuest = !order.user?.email;

  // Resolve customer name (support orders where name is embedded directly)
  const resolvedName = order.user?.name || 
    (order.shippingFirstName || order.shippingLastName
      ? `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim()
      : "Guest Customer");

  return (
    <tr className="hover:bg-slate-50/50 transition-colors duration-150 group">
      
      {/* 1. Visuel Preview Thumbnail */}
      <td className="px-4 py-3 shrink-0">
        {isMultiProduct ? (
          <Link
            href={`/admin/orders/${order.id}`}
            title={`Multi-products:\n${itemsTooltip}\nClick to view details.`}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-sm hover:bg-black hover:scale-105 transition-all duration-200 cursor-pointer select-none relative"
          >
            <Layers className="w-3.5 h-3.5 text-soft-gold" />
            <span className="text-[8px] font-bold text-soft-gold tracking-tighter">
              +{items.length}
            </span>
          </Link>
        ) : items[0] ? (
          (() => {
            const single = items[0];
            const imgUrl = single.productImage ?? single.product?.images?.[0];
            return imgUrl ? (
              <Link
                href={single.product?.slug ? `/shop/${single.product.slug}` : "/shop"}
                target="_blank"
                title={`View product page: ${single.productTitle}`}
                className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 relative overflow-hidden shrink-0 shadow-sm flex items-center justify-center hover:scale-105 hover:border-slate-400 hover:shadow transition-all duration-200 cursor-pointer block"
              >
                <Image
                  src={imgUrl}
                  alt={single.productTitle}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-xl border border-gray-100 bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 shadow-sm">
                <Package className="w-4 h-4" />
              </div>
            );
          })()
        ) : (
          <div className="w-10 h-10 rounded-xl border border-gray-100 bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 shadow-sm">
            <Package className="w-4 h-4" />
          </div>
        )}
      </td>

      {/* 2. Order Reference Tag */}
      <td className="px-4 py-3">
        <Link 
          href={`/admin/orders/${order.id}`}
          className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-xs hover:bg-slate-200 hover:text-black transition-colors"
        >
          {order.orderNumber}
        </Link>
      </td>

      {/* 3. Customer Information */}
      <td className="px-4 py-3 max-w-[200px] truncate">
        <div className="flex items-center gap-1.5">
          <p className="text-slate-900 font-bold text-xs">
            {resolvedName}
          </p>
          {order.hasReturnedOrders && (
            <span 
              className="bg-rose-50 text-rose-700 border border-rose-200 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full shrink-0 scale-90 cursor-help"
              title="Ce client a déjà effectué un retour (commande remboursée/retournée)"
            >
              Retourneur
            </span>
          )}
          {isGuest && (
            <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-full shrink-0 scale-90">
              Guest
            </span>
          )}
          {order.notes && order.notes.trim() !== "" && (
            <span 
              className="bg-violet-50 text-violet-700 border border-violet-100 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-full shrink-0 scale-90 cursor-help"
              title={order.notes}
            >
              Note
            </span>
          )}
        </div>
        
        {/* Email or Phone number fallback */}
        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-slate-400 font-medium">
          {order.user?.email ? (
            <span className="font-mono truncate">{order.user.email}</span>
          ) : order.shippingPhone ? (
            <span className="flex items-center gap-0.5 font-mono">
              <Phone className="w-2.5 h-2.5 shrink-0" /> {order.shippingPhone}
            </span>
          ) : order.user?.phone ? (
            <span className="flex items-center gap-0.5 font-mono">
              <Phone className="w-2.5 h-2.5 shrink-0" /> {order.user.phone}
            </span>
          ) : (
            <span className="italic text-slate-300">No contact</span>
          )}
        </div>
      </td>

      {/* 4. Items List/Qty */}
      <td className="px-4 py-3">
        {isMultiProduct ? (
          <span
            title={itemsTooltip}
            className="inline-flex items-center gap-1 bg-slate-950 text-soft-gold font-mono text-[9px] font-extrabold px-2 py-0.5 rounded border border-slate-800 cursor-help"
          >
            CART ({totalQty})
          </span>
        ) : (
          <span className="text-slate-700 text-xs font-semibold">
            {totalQty} item{totalQty > 1 ? "s" : ""}
          </span>
        )}
      </td>
      {/* 5. Total Price Amount */}
      <td className="px-4 py-3 font-bold text-slate-900 text-xs sm:text-sm">
        {formatPrice(order.subtotal - order.discount)}
      </td>
      {/* 6. Dynamic Payment Stats Badge (No select dropdown) */}
      <td className="px-4 py-3">
        {(() => {
          const displayStatus = 
            status === "DELIVERED" ? "PAID" :
            status === "REFUNDED" ? "REFUNDED" :
            paymentStatus;

          const displayLabel = 
            displayStatus === "PAID" ? "Paid" :
            displayStatus === "FAILED" ? "Failed" :
            displayStatus === "REFUNDED" ? "Unpaid (Returned)" :
            "Pending";

          const badgeStyles =
            displayStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold" :
            displayStatus === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200 font-bold" :
            displayStatus === "REFUNDED" ? "bg-rose-50 text-rose-700 border-rose-200 font-bold" :
            "bg-amber-50/70 text-amber-700 border-amber-200 font-bold";

          return (
            <span className={`inline-block text-[9.5px] uppercase tracking-wider px-2.5 py-1 border rounded-lg text-center w-28 ${badgeStyles}`}>
              {displayLabel}
            </span>
          );
        })()}
      </td>

      {/* 7. Dynamic Order Status Select */}
      <td className="px-4 py-3">
        {(() => {
          const isTransmitted = !!order.trackingNumber && order.carrier === "ZR_EXPRESS";
          const allowedStatuses = isTransmitted
            ? ORDER_STATUSES.filter((s) => s.value === status || s.value === "CANCELLED")
            : ORDER_STATUSES.filter((s) => ["PENDING", "CONFIRMED", "OUT_FOR_DELIVERY", "CANCELLED"].includes(s.value) || s.value === status);
          return (
            <select
              value={status}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className={`text-[9.5px] font-extrabold tracking-wider uppercase px-2 py-1 border rounded-lg cursor-pointer focus:outline-none focus:ring-4 transition-all w-36 text-center bg-white ${statusStyles}`}
            >
              {allowedStatuses.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          );
        })()}
      </td>

      {/* 8. Creation Order Date */}
      <td className="px-4 py-3 text-xs text-slate-500 font-semibold whitespace-nowrap">
        {formatDate(order.createdAt)}
      </td>

      {/* 9. Interactive Action Eye Button */}
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/orders/${order.id}`}
          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all inline-flex border border-transparent hover:border-slate-200 shadow-xs"
          title="View order details"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </td>
    </tr>
  );
}
