import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Package, Check, Calendar, MapPin, Truck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getZRSettings, zrGetStateHistory } from "@/lib/zrexpress";

type Props = { params: Promise<{ orderNumber: string }> };

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) notFound();

  const { orderNumber } = await params;
  const isAdmin = session.user.role === "ADMIN";

  const order = await db.order.findFirst({
    where: { orderNumber, ...(!isAdmin ? { userId: session.user.id } : {}) },
    include: {
      items: { include: { product: { select: { slug: true, images: true } } } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      coupon: { select: { code: true, discountType: true, discountValue: true } },
    },
  });

  if (!order) notFound();

  const t = await getTranslations("orderDetail");
  const tStatus = await getTranslations("orderStatus");

  const currentStepIndex = order.status === "CANCELLED" || order.status === "REFUNDED"
    ? -1
    : STATUS_STEPS.indexOf(order.status);

  let zrTrackingHistory: any[] | null = null;
  if (order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED") {
    const parcelId = order.zrParcelId || order.trackingNumber;
    if (parcelId) {
      const settings = await getZRSettings();
      if (settings) {
        const zrRes = await zrGetStateHistory(settings, parcelId);
        if (zrRes.ok && zrRes.data) {
          zrTrackingHistory = zrRes.data;
        }
      }
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-warm-white/20 min-h-screen animate-fade-in">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-brand-500 mb-10 select-none">
        <Link href="/account" className="hover:text-brand-800 transition-colors">
          {t("backToAccount")}
        </Link>
        <ChevronRight className="w-3 h-3 text-brand-300" />
        <span className="text-brand-800 font-medium">
          {t("orderRef")} {order.orderNumber}
        </span>
      </nav>

      {/* Header Info Block */}
      <div className="bg-white border border-brand-100/60 shadow-luxury px-6 py-8 sm:p-8 mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold-gradient" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-soft-gold text-sm">✦</span>
              <h1 className="font-display text-2xl sm:text-3xl text-black font-light tracking-wider uppercase">
                {order.orderNumber}
              </h1>
            </div>
            <p className="text-brand-600 text-xs sm:text-sm pl-6 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-brand-400" />
              {t("placedOn")} {formatDate(order.createdAt)}
            </p>
          </div>
          
          <Badge
            variant={
              order.status === "DELIVERED" ? "success" :
              order.status === "CANCELLED" || order.status === "REFUNDED" ? "destructive" :
              "info"
            }
            className="text-xs px-4 py-2 rounded-none tracking-widest font-semibold uppercase shadow-sm"
          >
            {tStatus(order.status)}
          </Badge>
        </div>
      </div>

      {/* Delivery Progress tracker - Fully Responsive */}
      {currentStepIndex >= 0 && (
        <div className="mb-12">
          {/* Desktop Horizontal Tracker */}
          <div className="hidden md:block bg-white border border-brand-100/60 shadow-luxury p-8 relative">
            <div className="flex items-center justify-between relative z-10">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step} className="flex-1 flex items-center relative">
                    <div className="flex flex-col items-center mx-auto relative z-10">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        active ? "bg-brand-900 border-brand-900 shadow-luxury scale-110" :
                        done ? "bg-brand-900 border-brand-900" :
                        "border-brand-200 bg-white"
                      }`}>
                        {done ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <div className="w-2.5 h-2.5 rounded-full bg-brand-300" />
                        )}
                      </div>
                      <p className={`text-[9px] uppercase tracking-widest mt-3 text-center max-w-[80px] leading-relaxed ${
                        active ? "text-brand-900 font-semibold" :
                        done ? "text-brand-700" :
                        "text-brand-400"
                      }`}>
                        {tStatus(step)}
                      </p>
                    </div>

                    {/* Connecting line to the next step */}
                    {i < STATUS_STEPS.length - 1 && (
                      <div className="absolute left-[50%] right-[-50%] top-4.5 -translate-y-1/2 h-[2px] -z-10">
                        <div className={`h-full w-full transition-all duration-500 ${
                          i < currentStepIndex ? "bg-brand-900" : "bg-brand-100"
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile Vertical Tracker */}
          <div className="block md:hidden bg-white border border-brand-100/60 shadow-luxury p-6">
            <h3 className="font-display text-[10px] text-brand-400 uppercase tracking-[0.3em] mb-6">
              Suivi d'expédition
            </h3>
            <div className="relative pl-6 border-l border-brand-100 ml-4 space-y-6">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step} className="relative">
                    {/* Circle timeline dot absolute positioned over border line */}
                    <div className={`absolute -left-[37px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                      active ? "bg-brand-900 border-brand-900 scale-110 shadow-sm" :
                      done ? "bg-brand-900 border-brand-900 text-white" :
                      "border-brand-200 bg-white text-brand-300"
                    }`}>
                      {done ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-300" />
                      )}
                    </div>
                    <div className="pl-3">
                      <p className={`text-xs uppercase tracking-widest ${
                        active ? "text-black font-semibold" :
                        done ? "text-brand-800" :
                        "text-brand-400"
                      }`}>
                        {tStatus(step)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items and History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Items card list */}
          <div className="bg-white border border-brand-100/60 shadow-luxury relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-gradient/65" />
            <h2 className="font-display text-base text-black uppercase tracking-wider p-6 border-b border-brand-100/60">
              {t("itemsOrdered")}
            </h2>
            <div className="divide-y divide-brand-100/50">
              {order.items.map((item: (typeof order.items)[number]) => (
                <div key={item.id} className="group flex items-center gap-6 p-6 hover:bg-brand-50/20 transition-colors duration-200">
                  <div className="w-20 h-24 bg-brand-50 shrink-0 relative overflow-hidden border border-brand-100/40">
                    {(item.productImage ?? item.product?.images?.[0]) && (
                      <Image
                        src={item.productImage ?? item.product?.images?.[0]!}
                        alt={item.productTitle}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-display text-sm font-medium text-black leading-snug">
                      {item.productTitle}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-brand-500 flex items-center gap-1.5">
                      {[item.size, item.color].filter(Boolean).join(" · ")}
                    </p>
                    <p className="text-xs text-brand-600">
                      {t("quantity")} <span className="font-semibold text-black">{item.quantity}</span>
                    </p>
                  </div>
                  <p className="font-display text-sm font-medium text-black shrink-0 pl-4">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Shipment / History Timeline */}
          {order.statusHistory.length > 0 && (
            <div className="bg-white border border-brand-100/60 shadow-luxury relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-gradient/65" />
              <h2 className="font-display text-base text-black uppercase tracking-wider p-6 border-b border-brand-100/60">
                {t("orderHistory")}
              </h2>
              <div className="p-6 space-y-6">
                {order.statusHistory.map((h: (typeof order.statusHistory)[number]) => (
                  <div key={h.id} className="flex gap-4 items-start relative">
                    <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Package className="w-3.5 h-3.5 text-soft-gold" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-xs uppercase tracking-widest text-black font-semibold">
                          {tStatus(h.status)}
                        </p>
                        <p className="text-[9px] uppercase tracking-widest text-brand-400">
                          {formatDate(h.createdAt)}
                        </p>
                      </div>
                      {h.note && (
                        <p className="text-xs text-brand-600 leading-relaxed bg-brand-50/50 p-3 border-l border-brand-200">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                
                {zrTrackingHistory && zrTrackingHistory.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="flex gap-4 items-start relative">
                    <div className="w-8 h-8 rounded-full bg-brand-900 text-white border border-brand-900 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-xs uppercase tracking-widest text-black font-semibold">
                          {h.stateName}
                        </p>
                        <p className="text-[9px] uppercase tracking-widest text-brand-400">
                          {h.stateDate ? formatDate(new Date(h.stateDate)) : ""}
                        </p>
                      </div>
                      {h.note && (
                        <p className="text-xs text-brand-600 leading-relaxed bg-brand-50/50 p-3 border-l border-brand-200">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pricing Summary & Address Details */}
        <div className="space-y-8">
          {/* Cost breakdown Summary card */}
          <div className="bg-white border border-brand-100/60 shadow-luxury relative overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gold-gradient" />
            <h3 className="font-display text-base text-black uppercase tracking-wider pb-3 border-b border-brand-100/50">
              {t("summary")}
            </h3>
            <div className="text-xs sm:text-sm space-y-4">
              <div className="flex justify-between text-brand-700">
                <span className="uppercase tracking-wider">{t("subtotal")}</span>
                <span className="font-medium text-black">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-700">
                <span className="uppercase tracking-wider">{t("shipping")}</span>
                <span className="font-medium text-black">
                  {order.shippingFee === 0 ? t("free") : formatPrice(order.shippingFee)}
                </span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 bg-emerald-50/50 py-1.5 px-3">
                  <span className="uppercase tracking-wider font-medium">{t("discount")}</span>
                  <span className="font-semibold">-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-base text-black border-t border-brand-100/60 pt-4 mt-2">
                <span className="uppercase font-medium tracking-widest">{t("total")}</span>
                <span className="font-semibold text-black">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address panel */}
          <div className="bg-white border border-brand-100/60 shadow-luxury relative overflow-hidden p-6 sm:p-8 space-y-4">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-gradient/65" />
            <div className="flex items-center gap-2 pb-2 border-b border-brand-100/50">
              <MapPin className="w-4 h-4 text-soft-gold" />
              <h3 className="font-display text-base text-black uppercase tracking-wider">
                {t("shippingAddress")}
              </h3>
            </div>
            <address className="not-italic text-xs sm:text-sm text-brand-700 leading-relaxed space-y-1">
              <p className="font-semibold text-black uppercase tracking-wider">
                {order.shippingFirstName} {order.shippingLastName}
              </p>
              <p className="text-brand-600">{order.shippingStreet}</p>
              <p className="text-brand-600">
                {order.shippingCity}, {order.shippingState} {order.shippingPostalCode}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-brand-500 font-medium pt-1">
                {order.shippingCountry}
              </p>
            </address>
          </div>

          {/* Tracking Panel */}
          {order.trackingNumber && (
            <div className="bg-white border border-brand-100/60 shadow-luxury relative overflow-hidden p-6 sm:p-8 space-y-3">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-gradient/65" />
              <div className="flex items-center gap-2 pb-2 border-b border-brand-100/50">
                <Truck className="w-4 h-4 text-soft-gold" />
                <h3 className="font-display text-base text-black uppercase tracking-wider">
                  {t("tracking")}
                </h3>
              </div>
              <div className="space-y-1.5 pt-1">
                <p className="text-xs uppercase tracking-widest text-brand-500 font-medium">
                  Transporteur : <span className="text-black font-semibold">
                    {order.status === "OUT_FOR_DELIVERY" || order.status === "DELIVERED" ? "ZR Express" : order.carrier || "Standard"}
                  </span>
                </p>
                <div className="bg-brand-50 border border-brand-100/60 py-2.5 px-4 inline-block w-full">
                  <p className="text-xs font-mono text-black tracking-wider text-center select-all">
                    {order.trackingNumber}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
