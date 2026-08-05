"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { formatPrice, getOptimizedImageUrl } from "@/lib/utils";
import { getThumbnail } from "@/lib/cloudinary";
import {
  Package, Check, Calendar, MapPin, Truck, ChevronRight,
  Loader2, Search, ArrowRight, HelpCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

function TrackingContent() {
  const tDetail = useTranslations("orderDetail");
  const tStatus = useTranslations("orderStatus");
  const tCheckout = useTranslations("checkout");
  const locale = useLocale();
  const searchParams = useSearchParams();

  const isAr = locale === "ar";

  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);

  // Auto-track if order is in query parameters (e.g. from success redirect)
  useEffect(() => {
    const queryOrder = searchParams.get("order");
    if (queryOrder) {
      setOrderNumber(queryOrder);
      handleTrack(queryOrder, "");
    }
  }, [searchParams]);

  async function handleTrack(targetOrder: string, targetPhone: string) {
    if (!targetOrder.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: targetOrder.trim(),
          phone: targetPhone.trim()
        })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        if (res.status === 403) {
          setError(
            isAr
              ? "فشلت عملية التحقق. يرجى إدخال رقم الهاتف المرتبط بهذا الطلب."
              : "Verification failed. Please enter the phone number associated with this order."
          );
        } else {
          setError(
            isAr
              ? "لم يتم العثور على الطلب. يرجى التحقق من الرقم المدخل."
              : "Order not found. Please verify the number entered."
          );
        }
        setOrder(null);
      } else {
        setOrder(result.data);
      }
    } catch (err) {
      setError(isAr ? "حدث خطأ غير متوقع." : "An unexpected error occurred.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  const currentStepIndex = order
    ? order.status === "CANCELLED" || order.status === "REFUNDED"
      ? -1
      : STATUS_STEPS.indexOf(order.status)
    : -1;

  if (order) {
    const currency = order.isInternational ? "EUR" : "DZD";
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 animate-fade-in">
        {/* Header reference */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-brand-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-soft-gold text-xs">✦</span>
              <h1 className="font-display text-xl sm:text-2xl text-black uppercase tracking-wider font-semibold">
                {tDetail("orderRef")} {order.orderNumber}
              </h1>
            </div>
            <p className="text-xs text-brand-500 mt-1 flex items-center gap-1.5 pl-4">
              <Calendar className="w-3.5 h-3.5" />
              {tDetail("placedOn")} {new Date(order.createdAt).toLocaleDateString("en-GB")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                order.status === "DELIVERED" ? "success" :
                order.status === "CANCELLED" || order.status === "REFUNDED" ? "destructive" :
                "info"
              }
              className="text-[10px] tracking-widest uppercase rounded-none px-3.5 py-1.5"
            >
              {tStatus(order.status)}
            </Badge>
            <button
              onClick={() => {
                setOrder(null);
                setPhone("");
                setOrderNumber("");
              }}
              className="text-xs text-brand-600 hover:text-black hover:underline"
            >
              {isAr ? "تتبع طلب آخر" : "Track another order"}
            </button>
          </div>
        </div>

        {/* Tracker Progress Bar */}
        {currentStepIndex >= 0 && (
          <div className="bg-white border border-brand-100/60 p-6 sm:p-8 mb-10 shadow-sm">
            <h3 className="text-xs uppercase tracking-widest text-brand-900 font-bold mb-6 flex items-center gap-2">
              <Truck className="w-4 h-4 text-soft-gold" /> {tDetail("tracking")}
            </h3>
            {/* Desktop progress */}
            <div className="hidden md:flex justify-between relative">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step} className="flex-1 flex items-center relative">
                    <div className="flex flex-col items-center mx-auto relative z-10">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                        active ? "bg-brand-900 border-brand-900 shadow-md scale-105" :
                        done ? "bg-brand-900 border-brand-900" :
                        "border-brand-200 bg-white"
                      }`}>
                        {done ? <Check className="w-4 h-4 text-white" /> : <span className="text-[10px] text-brand-400">{i + 1}</span>}
                      </div>
                      <span className={`text-[9px] uppercase tracking-wider mt-2.5 font-bold whitespace-nowrap ${
                        active ? "text-brand-900" :
                        done ? "text-brand-700" :
                        "text-brand-300"
                      }`}>
                        {tStatus(step)}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`absolute top-4 left-[60%] right-[-40%] h-[2px] z-0 ${
                        i < currentStepIndex ? "bg-brand-900" : "bg-brand-100"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Vertical progress */}
            <div className="md:hidden space-y-4 pl-4 border-l border-brand-100">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const active = i === currentStepIndex;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border shrink-0 ${
                      active ? "bg-brand-900 border-brand-900" :
                      done ? "bg-brand-900 border-brand-900" :
                      "border-brand-200 bg-white"
                    }`}>
                      {done ? <Check className="w-3 h-3 text-white" /> : <span className="text-[9px] text-brand-400">{i + 1}</span>}
                    </div>
                    <span className={`text-xs uppercase tracking-wider font-semibold ${
                      active ? "text-brand-900 font-bold" :
                      done ? "text-brand-700" :
                      "text-brand-300"
                    }`}>
                      {tStatus(step)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Items ordered */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xs uppercase tracking-widest text-brand-900 font-bold border-b border-brand-100 pb-2">
              {tDetail("itemsOrdered")}
            </h3>
            <div className="divide-y divide-brand-100/50">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-4 flex gap-4">
                  <div className="w-16 h-20 bg-brand-50 relative overflow-hidden shrink-0 border border-brand-100">
                    <Image
                      src={getThumbnail(item.productImage || (item.product?.images?.[0]))}
                      alt={item.productTitle}
                      fill
                      loading="lazy"
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-brand-900 truncate mb-1">{item.productTitle}</h4>
                    <p className="text-xs text-brand-500 flex gap-2">
                      {item.size && <span>Size: {item.size}</span>}
                      {item.color && <span>Color: {item.color}</span>}
                    </p>
                    <p className="text-xs font-medium text-brand-700 mt-2">
                      {tDetail("quantity")} {item.quantity} · {formatPrice(item.price, currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Summary */}
          <div className="space-y-8">
            {/* Address */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-brand-900 font-bold border-b border-brand-100 pb-2 mb-3">
                {tDetail("shippingAddress")}
              </h3>
              <div className="text-xs text-brand-750 space-y-1 font-medium not-italic">
                <p className="font-bold text-black">{order.shippingFirstName} {order.shippingLastName}</p>
                <p>{order.shippingStreet}</p>
                <p>{order.shippingCity}, {order.shippingState || ""}</p>
                <p>{order.shippingCountry}</p>
                <p className="text-brand-500">{order.shippingPhone}</p>
              </div>
            </div>

            {/* Price Summary */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-brand-900 font-bold border-b border-brand-100 pb-2 mb-3">
                {tDetail("summary")}
              </h3>
              <div className="text-xs space-y-2.5 font-medium text-brand-750">
                <div className="flex justify-between">
                  <span>{tDetail("subtotal")}</span>
                  <span>{formatPrice(order.totalAmount - (order.shippingFee ?? 0), currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{tDetail("shipping")}</span>
                  <span>{order.shippingFee === 0 ? tDetail("free") : formatPrice(order.shippingFee ?? 0, currency)}</span>
                </div>
                <div className="flex justify-between text-black font-bold border-t border-brand-100 pt-2.5 text-sm">
                  <span>{tDetail("total")}</span>
                  <span>{formatPrice(order.totalAmount, currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="text-center mb-8">
        <span className="text-soft-gold text-2xl mb-3 block">✦</span>
        <h1 className="font-display text-3xl text-brand-900 font-semibold tracking-wider uppercase">
          {isAr ? "تتبع طلبي" : "Track My Order"}
        </h1>
        <p className="text-xs text-brand-500 tracking-[0.2em] mt-1.5 uppercase">
          {isAr ? "متابعة حالة شحنتك" : "Follow your shipment status"}
        </p>
      </div>

      <div className="bg-white border border-brand-100/80 shadow-md p-6 sm:p-8 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 font-semibold rounded-md">
            {error}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack(orderNumber, phone);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-brand-900 font-bold mb-1.5">
              {isAr ? "رقم الطلب أو التتبع *" : "Order or Tracking Number *"}
            </label>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              placeholder={isAr ? "مثال: ELH-LQRX98-2B3A" : "E.g., ELH-LQRX98-2B3A"}
              className="w-full border border-brand-200 px-4 py-3 text-sm text-black focus:outline-none focus:border-brand-900 transition-colors bg-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-brand-900 font-bold mb-1.5">
              {isAr ? "رقم الهاتف (للتحقق)" : "Phone Number (for verification)"}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XXXXXXXX / +33 6 XX XX..."
              className="w-full border border-brand-200 px-4 py-3 text-sm text-black focus:outline-none focus:border-brand-900 transition-colors bg-white"
            />
            <p className="text-[9px] text-brand-400 mt-1 pl-1">
              {isAr
                ? "✦ اختياري إذا كان هذا آخر طلب قمت بإنشائه في هذا المتصفح."
                : "✦ Optional if this is the last order placed in this browser."}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-900 text-white py-3 text-xs uppercase tracking-widest font-bold hover:bg-brand-850 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:bg-brand-200"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-soft-gold" />
            ) : (
              <>
                <span>{isAr ? "تتبع" : "Track Order"}</span>
                <ArrowRight className="w-3.5 h-3.5 text-soft-gold" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-warm-white/10 py-12">
      <Suspense fallback={<div className="text-center py-24"><Loader2 className="w-8 h-8 animate-spin mx-auto text-soft-gold" /></div>}>
        <TrackingContent />
      </Suspense>
    </div>
  );
}
