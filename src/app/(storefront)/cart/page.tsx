"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2, Minus, Plus, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice, getOptimizedImageUrl } from "@/lib/utils";
import { getThumbnail } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRegion } from "@/providers/region-provider";

export default function CartPage() {
  const t = useTranslations();
  const { status } = useSession();
  const { items, removeItem, updateQuantity, syncWithServer, subtotal } = useCartStore();
  const { region, isInternationalEnabled } = useRegion();

  const isInternational = isInternationalEnabled && region === "INTERNATIONAL";
  const currency = isInternational ? "EUR" : "DZD";

  useEffect(() => {
    if (status === "authenticated") {
      syncWithServer();
    }
  }, [status, syncWithServer]);

  const sub = subtotal(isInternational);
  const total = sub;
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  async function handleRemove(itemId: string) {
    try {
      await removeItem(itemId);
      toast.success("Item removed");
    } catch {
      toast.error("Unable to remove item");
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center arabesque-bg">
        <div className="ornament-divider max-w-xs mx-auto mb-8">
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <ShoppingBag className="w-14 h-14 text-brand-200 mx-auto mb-6" />
        <h1 className="font-display text-3xl text-brand-900 mb-3">{t("cart.empty")}</h1>
        <p className="text-brand-400 text-sm mb-2">{t("cart.emptyHint")}</p>
        <p className="font-arabic text-soft-gold text-sm mb-8 opacity-80">ابدئي رحلتك في الأناقة</p>
        <Link href="/shop">
          <Button variant="luxury" size="lg">{t("cart.continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <div className="ornament-divider max-w-sm mb-4">
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <h1 className="font-display text-4xl text-black">{t("cart.title")}</h1>
        <p className="text-brand-400 text-sm mt-1">{itemCount} {itemCount <= 1 ? "item" : "items"}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-0 divide-y divide-brand-100">
          {items.map((item) => (
            <div key={item.id} className="flex gap-5 py-6 group">
              <Link
                href={`/shop/${item.productId}`}
                className="relative w-24 h-32 shrink-0 bg-brand-50 overflow-hidden border border-transparent group-hover:border-soft-gold/30 transition-colors"
              >
                {item.image && (
                  <Image
                    src={getThumbnail(item.image)}
                    alt={item.title}
                    fill
                    loading="lazy"
                    sizes="96px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <Link
                      href={`/shop/${item.productId}`}
                      className="font-display text-base text-brand-900 hover:text-soft-gold transition-colors line-clamp-2"
                    >
                      {item.title}
                    </Link>
                    <div className="mt-1 space-y-0.5 text-xs text-brand-400">
                      {item.size  && <p>Size: {item.size}</p>}
                      {item.color && <p>Color: {item.color}</p>}
                    </div>
                    <p className="text-xs text-brand-500 mt-1">{formatPrice(isInternational ? item.priceEur : item.price, currency)} / unit</p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="p-1.5 text-brand-300 hover:text-brand-700 hover:bg-brand-50 transition-colors shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-5">
                  <div className="flex items-center border border-brand-200">
                    <button
                      className="qty-btn hover:border-soft-gold hover:text-soft-gold"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      className="qty-btn hover:border-soft-gold hover:text-soft-gold"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-semibold text-brand-900">{formatPrice((isInternational ? item.priceEur : item.price) * item.quantity, currency)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-brand-50 border border-brand-100 p-6 space-y-5 sticky top-28">
            <div className="h-[2px] -mx-6 -mt-6 mb-2 bg-gold-gradient opacity-60" />
            <h2 className="font-display text-xl text-brand-900">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-brand-600">
                <span>{t("cart.subtotal")} ({itemCount} {itemCount <= 1 ? "item" : "items"})</span>
                <span>{formatPrice(sub, currency)}</span>
              </div>

            </div>

            <div className="border-t border-brand-200 pt-4">
              <div className="flex justify-between font-semibold text-brand-900 text-base">
                <span>{t("cart.total")}</span>
                <span>{formatPrice(total, currency)}</span>
              </div>
              <p className="text-[10px] text-brand-400 mt-1 tracking-wider">Taxes included</p>
            </div>

            <Link href="/checkout" className="block">
              <Button
                variant="luxury"
                size="lg"
                className="w-full relative overflow-hidden group py-4 transition-all duration-300 ease-out border border-black hover:bg-white hover:text-black tracking-[0.25em] text-xs font-semibold"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span className="text-soft-gold text-xs transition-colors group-hover:text-black"></span>
                  {t("cart.checkout")}
                  <span className="text-soft-gold text-xs transition-colors group-hover:text-black"></span>
                </span>
              </Button>
            </Link>

            <Link href="/shop" className="block text-center text-[10px] uppercase tracking-[0.2em] text-brand-400 hover:text-soft-gold transition-colors pt-1">
              {t("cart.continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
