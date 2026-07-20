"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, Package, User, Phone, MapPin, Truck, Loader2 } from "lucide-react";
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
  isMobileView?: boolean;
}

export default function OrderRow({ order, role, isMobileView }: OrderRowProps) {
  const router = useRouter();
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [updating, setUpdating] = useState(false);
  const [transmitting, setTransmitting] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState<string | null | undefined>(order.trackingNumber);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleTransmitZR() {
    setTransmitting(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/ship-zr`, {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) {
        const errMsg = typeof data.error === "string" ? data.error : (data.error ? JSON.stringify(data.error) : "Échec de la transmission à ZR Express");
        toast.error(errMsg);
        return;
      }
      toast.success(data.message ?? "Colis créé avec succès chez ZR Express !");
      setTrackingNumber(data.trackingNumber);
      setStatus("CONFIRMED");
      router.refresh();
    } catch {
      toast.error("Erreur de connexion serveur");
    } finally {
      setTransmitting(false);
    }
  }

  const items = order.items;

  // Resolve Wilaya name
  const wilaya = getWilayaByCode(order.wilayaCode ?? "");
  const wilayaName = wilaya ? wilaya.name : (order.shippingState || "");

  // Status badge styling classes
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
      if (data.data?.trackingNumber) {
        toast.success(`Confirmée et transmise à ZR Express (N° ${data.data.trackingNumber})`);
      } else {
        toast.success("Statut mis à jour avec succès");
      }
      setIsModalOpen(false);
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
      setIsModalOpen(false);
      router.refresh();
    } catch {
      toast.error("Connection error");
    } finally {
      setUpdating(false);
    }
  }

  const isGuest = !order.user?.email;

  const resolvedName = order.user?.name || 
    (order.shippingFirstName || order.shippingLastName
      ? `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim()
      : "Guest Customer");

  const phoneNum = order.shippingPhone || order.user?.phone;
  const formattedPhone = phoneNum?.replace(/\D/g, "");

  // Render detail modal
  const renderModal = () => (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 cursor-default text-left font-sans"
      onClick={(e) => {
        e.stopPropagation();
        setIsModalOpen(false);
      }}
    >
      <div 
        className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              Détails Commande {order.orderNumber}
              {order.isInternational && (
                <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                  📋 Devis International
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Créée le {formatDate(order.createdAt)}
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Statuses & ZR Action */}
          <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Statut de Commande
                </label>
                <select
                  value={status}
                  disabled={updating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`w-full text-xs font-bold px-3 py-1.5 border rounded-xl bg-white ${statusStyles}`}
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
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Statut de Paiement
                </label>
                <select
                  value={paymentStatus}
                  disabled={updating || (role === "CONFIRMATRICE" && paymentStatus !== "PAID")}
                  onChange={(e) => handlePaymentStatusChange(e.target.value)}
                  className={`w-full text-xs font-bold px-3 py-1.5 border rounded-xl bg-white ${paymentStyles}`}
                >
                  <option value="PENDING">⏳ En attente</option>
                  <option value="PAID">💵 Payé</option>
                  <option value="FAILED">✕ Échoué</option>
                  <option value="REFUNDED">↩ Remboursé</option>
                </select>
              </div>
            </div>

            {/* ZR Express Transmit Button or Tracking Badge */}
            {!order.isInternational && (
              <div className="pt-2 border-t border-slate-200/60">
                {trackingNumber ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                      Colis transmis à ZR Express
                    </span>
                    <span className="font-mono text-emerald-950 font-extrabold bg-white px-2 py-0.5 rounded border border-emerald-200">
                      N° Suivi: {trackingNumber}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={transmitting || updating}
                    onClick={handleTransmitZR}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all border border-emerald-500 hover:border-emerald-600 cursor-pointer disabled:opacity-60"
                  >
                    {transmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmission en cours à ZR Express...</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4" />
                        <span>🚀 Transmettre le colis à ZR Express</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Customer & Shipping info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
              Client & Livraison
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="font-bold text-slate-900">{resolvedName}</p>
                {phoneNum && (
                  <p className="font-mono text-slate-600 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {phoneNum}
                  </p>
                )}
                {order.user?.email && (
                  <p className="text-slate-500 font-mono text-[11px]">{order.user.email}</p>
                )}
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {wilayaName} {order.wilayaCode ? `(${order.wilayaCode})` : ""}
                </p>
                <p className="text-slate-600">{order.shippingStreet || order.shippingCity || "Adresse non renseignée"}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-1">
                  {order.deliveryType === "DOMICILE" ? "🏠 Livraison à domicile" : "📦 Stop Desk (Bureau)"}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">
              Articles ({items.length})
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-150 rounded-2xl overflow-hidden">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs bg-white">
                  <div className="flex items-center gap-3">
                    {item.productImage || item.product?.images?.[0] ? (
                      <div className="w-10 h-12 relative rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                        <Image
                          src={item.productImage || item.product!.images[0]}
                          alt={item.productTitle}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-12 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900">{item.productTitle}</p>
                      {(item.size || item.color) && (
                        <p className="text-[11px] text-slate-400">
                          {[item.color, item.size].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">
                    x{item.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between sticky bottom-0 z-10">
          <div className="text-sm font-bold text-slate-900">
            Total: <span className="font-mono text-slate-900">{formatPrice(order.totalAmount)}</span>
          </div>
          <Link
            href={`/admin/orders/${order.id}`}
            className="bg-slate-900 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            Gérer la commande complète →
          </Link>
        </div>
      </div>
    </div>
  );

  // ── Mobile Card View ────────────────────────────────────────────────────────
  if (isMobileView) {
    return (
      <div 
        onClick={() => setIsModalOpen(true)}
        className="p-4 space-y-3 bg-white hover:bg-slate-50/70 transition-colors cursor-pointer text-left"
      >
        {/* Top Header Row: Order Number, Date, Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/admin/orders/${order.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg hover:bg-slate-200"
            >
              {order.orderNumber}
            </Link>
            {order.trackingNumber && (
              <span className="flex items-center gap-1 font-mono text-[9px] font-bold text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                <Truck className="w-2.5 h-2.5 text-slate-400" />
                {order.trackingNumber}
              </span>
            )}
            {order.isInternational && (
              <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[8px] font-bold px-1.5 py-0.5 rounded">
                Devis Intl
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {formatDate(order.createdAt)}
          </span>
        </div>

        {/* Customer & Address Row */}
        <div className="flex flex-col gap-1.5 border-l-2 border-slate-200 pl-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">{resolvedName}</span>
              {isGuest && (
                <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.2 rounded-full">
                  Guest
                </span>
              )}
            </div>

            {/* WhatsApp Link */}
            {phoneNum && (
              <a
                href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Bonjour ${resolvedName}, concernant votre commande ${order.orderNumber}...`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs"
              >
                <Phone className="w-3 h-3 text-emerald-600" />
                <span className="font-mono">{phoneNum}</span>
              </a>
            )}
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">
              {order.shippingStreet ? `${order.shippingStreet}, ` : ""}{wilayaName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {order.deliveryType === "DOMICILE" ? (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold px-1.5 py-0.5 rounded">
                🏠 Domicile
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 font-extrabold px-1.5 py-0.5 rounded">
                📦 Stop Desk
              </span>
            )}
            <span className="font-bold text-slate-900 text-xs">{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* Items Brief */}
        <div className="text-[11px] text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="truncate font-medium">{item.productTitle}</span>
              <span className="font-bold text-slate-900 font-mono">x{item.quantity}</span>
            </div>
          ))}
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <select
            value={status}
            disabled={updating}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`text-[9.5px] font-extrabold uppercase px-2 py-1 border rounded-lg cursor-pointer text-center bg-white ${statusStyles}`}
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

          <Link
            href={`/admin/orders/${order.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            Voir Fiche
          </Link>
        </div>

        {isModalOpen && renderModal()}
      </div>
    );
  }

  // ── Desktop Table Row View ──────────────────────────────────────────────────
  return (
    <tr 
      onClick={() => setIsModalOpen(true)} 
      className="hover:bg-slate-50/50 transition-colors duration-150 group cursor-pointer"
    >
      {/* 1. Commande & Cliente (Merged Order Number + Customer + Address) */}
      <td className="px-4 py-3 min-w-[260px]">
        <div className="flex flex-col gap-1.5">
          {/* Header line: Order number + Tracking badge + International badge */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link 
              href={`/admin/orders/${order.id}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-lg shadow-xs hover:bg-slate-200 transition-colors"
            >
              {order.orderNumber}
            </Link>

            {order.trackingNumber && (
              <div className="flex items-center gap-1 font-mono text-[9.5px] text-slate-600 font-bold bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded shadow-xs" title={`Transporteur: ${order.carrier ?? 'ZR_EXPRESS'}`}>
                <Truck className="w-2.5 h-2.5 text-slate-400 shrink-0" /> {order.trackingNumber}
              </div>
            )}

            {order.isInternational && (
              <span className="bg-sky-50 text-sky-700 border border-sky-200 text-[8.5px] font-bold px-1.5 py-0.5 rounded-md">
                📋 Devis International
              </span>
            )}
          </div>

          {/* Customer Name + Guest/Notes tag */}
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

          {/* Phone/WhatsApp Link */}
          <div className="flex items-center">
            {phoneNum ? (
              <a 
                href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Bonjour ${resolvedName}, concernant votre commande ${order.orderNumber}...`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 text-[10.5px] font-extrabold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all duration-200 shadow-xs"
                title="Contacter par WhatsApp"
              >
                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="font-mono">{phoneNum}</span>
              </a>
            ) : (
              <span className="italic text-slate-400 text-[10px]">Pas de téléphone</span>
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

          {/* Delivery Badge */}
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {order.deliveryType === "DOMICILE" ? (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                🏠 À Domicile
              </span>
            ) : (
              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[8.5px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">
                📦 Bureau Stop Desk
              </span>
            )}
          </div>
        </div>
      </td>

      {/* 2. Items List/Qty */}
      <td className="px-4 py-3 max-w-[240px]">
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

      {/* 3. Total Price Amount */}
      <td className="px-4 py-3 font-bold text-slate-900 text-xs sm:text-sm">
        {formatPrice(order.totalAmount)}
      </td>

      {/* 4. Dynamic Payment Status Select */}
      <td className="px-4 py-3">
        <select
          value={paymentStatus}
          disabled={updating || (role === "CONFIRMATRICE" && paymentStatus !== "PAID")}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handlePaymentStatusChange(e.target.value)}
          className={`text-[9.5px] font-extrabold tracking-wider uppercase px-2 py-1 border rounded-lg cursor-pointer focus:outline-none focus:ring-4 transition-all w-28 text-center bg-white ${paymentStyles}`}
        >
          <option value="PENDING">⏳ En attente</option>
          <option value="PAID">💵 Payé</option>
          <option value="FAILED">✕ Échoué</option>
          <option value="REFUNDED">↩ Remboursé</option>
        </select>
      </td>

      {/* 5. Dynamic Order Status Select */}
      <td className="px-4 py-3">
        <select
          value={status}
          disabled={updating}
          onClick={(e) => e.stopPropagation()}
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

      {/* 6. Creation Order Date */}
      <td className="px-4 py-3 text-xs text-slate-500 font-semibold whitespace-nowrap">
        {formatDate(order.createdAt)}
      </td>

      {/* 7. Action Button */}
      <td className="px-4 py-3 text-right">
        <Link
          href={`/admin/orders/${order.id}`}
          onClick={(e) => e.stopPropagation()}
          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all inline-flex border border-transparent hover:border-slate-200 shadow-xs"
          title="View order details"
        >
          <Eye className="w-4 h-4" />
        </Link>
      </td>

      {/* Modal Cell */}
      {isModalOpen && (
        <td className="p-0 border-none w-0 h-0 absolute overflow-hidden">
          {renderModal()}
        </td>
      )}
    </tr>
  );
}
