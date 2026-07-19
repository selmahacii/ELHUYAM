"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, Package, Layers, User, Phone, MapPin, Truck, CreditCard } from "lucide-react";
import { toast } from "react-hot-toast";
import { formatDate, formatPrice } from "@/lib/utils";
import { getWilayaByCode } from "@/lib/wilayas";

interface OrderItem {
  quantity: number;
  productTitle: string;
  productImage?: string | null;
  size?: string | null;
  color?: string | null;
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
    paymentStatus: string;
    status: string;
    isInternational?: boolean;
    shippingCountry?: string | null;
    user?: {
      name: string | null;
      email: string | null;
      phone?: string | null;
    } | null;
    items: OrderItem[];
    shippingPhone?: string | null;
    shippingFirstName?: string | null;
    shippingLastName?: string | null;
    shippingStreet?: string | null;
    shippingCity?: string | null;
    shippingState?: string | null;
    deliveryType: string;
    wilayaCode?: string | null;
    paymentMethod?: string | null;
    trackingNumber?: string | null;
    carrier?: string | null;
    notes?: string | null;
  };
  role?: string;
}

export default function OrderRow({ order, role }: OrderRowProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [updating, setUpdating] = useState(false);

  const items = order.items;
  const isMultiProduct = items.length > 1;

  // Compute total quantity
  const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);

  // Resolve Wilaya name
  const wilaya = getWilayaByCode(order.wilayaCode ?? "");
  const wilayaName = wilaya ? wilaya.name : (order.shippingState || "");

  // Compile list of titles for tooltip
  const itemsTooltip = items
    .map((item) => `${item.productTitle} (Qté: ${item.quantity})`)
    .join("\n");

  // Status badge styling classes (French translation coherent color codes)
  const statusStyles =
    status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20" :
    status === "CANCELLED" ? "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20" :
    status === "REFUNDED" ? "bg-pink-50 text-pink-700 border-pink-200 focus:ring-pink-500/20" :
    status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20" :
    status === "CONFIRMED" ? "bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20" :
    status === "PROCESSING" ? "bg-indigo-50 text-indigo-700 border-indigo-200 focus:ring-indigo-500/20" :
    status === "SHIPPED" ? "bg-purple-50 text-purple-700 border-purple-200 focus:ring-purple-500/20" :
    status === "OUT_FOR_DELIVERY" ? "bg-yellow-50 text-yellow-700 border-yellow-200 focus:ring-yellow-500/20" :
    "bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-500/20";

  // Payment badge styling classes
  const paymentStyles =
    paymentStatus === "PAID" ? "bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20" :
    paymentStatus === "FAILED" ? "bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20" :
    paymentStatus === "REFUNDED" ? "bg-pink-50 text-pink-700 border-pink-200 focus:ring-pink-500/20" :
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

      {/* 2. Order Reference Tag & Tracking */}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <Link 
            href={`/admin/orders/${order.id}`}
            className="font-mono text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-xs hover:bg-slate-200 hover:text-black transition-colors w-fit"
          >
            {order.orderNumber}
          </Link>
          {order.trackingNumber && (
            <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-500 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shadow-xs w-fit" title={`Transporteur: ${order.carrier ?? 'ZR_EXPRESS'}`}>
              <Truck className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {order.trackingNumber}
            </div>
          )}
        </div>
      </td>

      {/* 3. Customer Information */}
      <td className="px-4 py-3 max-w-[240px]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-slate-900 font-bold text-xs">
              {resolvedName}
            </p>
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
          
          {/* Phone number and WhatsApp links */}
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              {order.shippingPhone ? (
                <a href={`tel:${order.shippingPhone}`} className="flex items-center gap-0.5 font-mono hover:text-slate-900 transition-colors">
                  <Phone className="w-2.5 h-2.5 shrink-0 text-slate-400" /> {order.shippingPhone}
                </a>
              ) : order.user?.phone ? (
                <a href={`tel:${order.user.phone}`} className="flex items-center gap-0.5 font-mono hover:text-slate-900 transition-colors">
                  <Phone className="w-2.5 h-2.5 shrink-0 text-slate-400" /> {order.user.phone}
                </a>
              ) : (
                <span className="italic text-slate-355">Pas de téléphone</span>
              )}
            </div>
            
            {(order.shippingPhone || order.user?.phone) && (
              <a 
                href={`https://wa.me/${(order.shippingPhone || order.user?.phone)?.replace(/\D/g, '')}?text=${encodeURIComponent(`Bonjour ${resolvedName}, concernant votre commande ${order.orderNumber}...`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[8.5px] uppercase tracking-wider font-bold px-1 py-0.2 rounded transition-colors flex items-center gap-0.5 shadow-xs"
                title="Contacter par WhatsApp"
              >
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                <span>WhatsApp</span>
              </a>
            )}
          </div>

          {/* Full Address details */}
          <div className="flex items-start gap-1 text-[10.5px] text-slate-500 font-medium leading-normal mt-0.5" title={order.shippingStreet ?? ""}>
            <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
            <span>
              {order.shippingStreet ? `${order.shippingStreet}, ` : ""}{wilayaName}
              {order.isInternational && order.shippingCountry && (
                <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[8px] font-bold px-1 py-0.2 rounded ml-1 uppercase">
                  🌐 {order.shippingCountry}
                </span>
              )}
            </span>
          </div>

          {/* Delivery & Payment Method Badges */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {order.deliveryType === "DOMICILE" ? (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                🏠 À Domicile
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                📦 Bureau Stop Desk
              </span>
            )}

            <span className="bg-slate-50 text-slate-750 border border-slate-200 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
              💵 Paiement à la livraison (COD)
            </span>
          </div>
        </div>
      </td>

      {/* 4. Items List/Qty */}
      <td className="px-4 py-3 max-w-[260px]">
        <div className="space-y-1 max-h-[85px] overflow-y-auto pr-1">
          {items.map((item, idx) => (
            <div key={idx} className="text-xs font-semibold text-slate-800 flex items-start gap-1 leading-normal">
              <span className="bg-slate-100 border border-slate-200 text-slate-700 text-[9.5px] font-extrabold px-1 rounded shrink-0 mt-0.5">
                x{item.quantity}
              </span>
              <span className="truncate" title={`${item.productTitle}${item.size || item.color ? ` (${[item.color, item.size].filter(Boolean).join(', ')})` : ''}`}>
                {item.productTitle}
                {(item.size || item.color) && (
                  <span className="text-[10px] text-slate-400 font-normal ml-1 whitespace-nowrap">
                    ({[item.color, item.size].filter(Boolean).join(', ')})
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </td>

      {/* 5. Total Price Amount */}
      <td className="px-4 py-3 font-bold text-slate-900 text-xs sm:text-sm">
        {formatPrice(order.totalAmount)}
      </td>

      {/* 6. Dynamic Payment Status Select */}
      <td className="px-4 py-3">
        <select
          value={paymentStatus}
          disabled={updating || (role === "CONFIRMATRICE" && paymentStatus !== "PAID")}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
          className={`text-[9.5px] font-extrabold tracking-wider uppercase px-2 py-1 border rounded-lg cursor-pointer focus:outline-none focus:ring-4 transition-all w-28 text-center bg-white ${paymentStyles}`}
        >
          <option value="PENDING">⏳ En attente</option>
          <option value="PAID">💵 Payé</option>
          <option value="FAILED">✕ Échoué</option>
          <option value="REFUNDED">↩ Remboursé</option>
        </select>
      </td>

      {/* 7. Dynamic Order Status Select */}
      <td className="px-4 py-3">
        <select
          value={status}
          disabled={updating}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`text-[9.5px] font-extrabold tracking-wider uppercase px-2 py-1 border rounded-lg cursor-pointer focus:outline-none focus:ring-4 transition-all w-36 text-center bg-white ${statusStyles}`}
        >
          <option value="PENDING">⏳ En attente</option>
          <option value="CONFIRMED">✓ Confirmé</option>
          <option value="PROCESSING">📦 En préparation</option>
          <option value="SHIPPED">🚚 Expédié</option>
          <option value="OUT_FOR_DELIVERY">🛵 En livraison</option>
          <option value="DELIVERED">🎉 Livré</option>
          <option value="CANCELLED">✕ Annulé</option>
          <option value="REFUNDED">↩ Retourné</option>
        </select>
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
