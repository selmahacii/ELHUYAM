"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useCartStore } from "@/stores/cart-store";
import { formatPrice, getOptimizedImageUrl } from "@/lib/utils";
import { getThumbnail } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";

interface WishlistProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    slug: string;
    price: number;
    discountPrice?: number | null;
    priceEur: number;
    discountPriceEur?: number | null;
    images: string[];
    stock: number;
  };
}

export default function WishlistPage() {
  const { status } = useSession();
  const [items, setItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const t = useTranslations("wishlist");
  const tProduct = useTranslations("product");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setItems([]);
      setLoading(false);
      return;
    }

    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((d) => setItems(d.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [status]);

  async function handleRemove(productId: string) {
    await toggleItem(productId);
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    toast.success(t("removedFromWishlist"));
  }

  async function handleMoveToCart(item: WishlistProduct) {
    try {
      await addItem({ productId: item.productId, quantity: 1, productData: item.product });
      await handleRemove(item.productId);
      toast.success(t("movedToCart"));
    } catch {
      toast.error(t("failedAddToCart"));
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-brand-100 mb-3" />
              <div className="h-3 bg-brand-100 w-3/4 mb-2" />
              <div className="h-3 bg-brand-100 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center arabesque-bg">
        <div className="ornament-divider max-w-xs mx-auto mb-8">
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <Heart className="w-14 h-14 text-brand-200 mx-auto mb-6" />
        <h1 className="font-display text-3xl text-brand-900 mb-3">{t("empty")}</h1>
        <p className="text-brand-400 text-sm mb-2">{t("emptyHint")}</p>
        <p className="font-arabic text-soft-gold text-sm mb-8 opacity-80">{t("emptyArabic")}</p>
        <Link href="/shop">
          <Button variant="luxury" size="lg">{t("explore")}</Button>
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
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-4xl text-brand-900">{t("title")}</h1>
          <span className="text-brand-400 text-sm">
            {items.length} {items.length <= 1 ? t("itemCount", { count: items.length }) : t("itemCountPlural", { count: items.length })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map(({ id, productId, product }) => (
          <div key={id} className="group relative grid-item-enter">
            <Link href={`/shop/${product.slug}`} className="block">
              <div className="relative aspect-[3/4] bg-brand-50 overflow-hidden mb-3">
                <Image
                  src={getThumbnail(product.images[0])}
                  alt={product.title}
                  fill
                  loading="lazy"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 border border-transparent group-hover:border-soft-gold/50 transition-all duration-500 z-10" />
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
                    <span className="text-[10px] uppercase tracking-widest text-brand-500 font-medium">{tProduct("outOfStock")}</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-brand-900 mb-1 line-clamp-2 group-hover:text-soft-gold transition-colors">
                {product.title}
              </h3>
              <p className="text-sm font-semibold text-brand-900">
                {formatPrice(product.discountPrice ?? product.price)}
                {product.discountPrice && (
                  <span className="text-brand-400 line-through ml-2 text-xs font-normal">
                    {formatPrice(product.price)}
                  </span>
                )}
              </p>
            </Link>

            <div className="flex gap-2 mt-3">
              <Button
                variant="luxury"
                size="sm"
                className="flex-1 gap-1.5"
                disabled={product.stock === 0}
                onClick={() => handleMoveToCart({ id, productId, product })}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {t("addToCart")}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 hover:border-brand-900 hover:bg-brand-900 hover:text-white transition-all"
                onClick={() => handleRemove(productId)}
                aria-label={t("removedFromWishlist")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <div className="ornament-divider max-w-xs mx-auto mb-4">
          <span className="text-soft-gold text-xs">✦</span>
        </div>
        <Link
          href="/shop"
          className="text-[10px] uppercase tracking-[0.25em] text-brand-400 hover:text-soft-gold transition-colors"
        >
          {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}
