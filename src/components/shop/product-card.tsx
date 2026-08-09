"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { cn, formatPrice, calculateDiscountPercent, getOptimizedImageUrl } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRegion } from "@/providers/region-provider";

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  discountPrice?: number | null;
  priceEur: number;
  discountPriceEur?: number | null;
  images: string[];
  stock: number;
  featured?: boolean;
  bestseller?: boolean;
  newArrival?: boolean;
  avgRating?: number;
  reviewCount?: number;
  lowStockThreshold?: number;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export default function ProductCard({ product, className, priority = false }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  const t = useTranslations("product");
  const tShop = useTranslations("shop");
  const { region, isInternationalEnabled } = useRegion();

  const isInternational = isInternationalEnabled && region === "INTERNATIONAL";
  const displayPrice = isInternational ? (product.priceEur || 0) : product.price;
  const displayDiscountPrice = isInternational ? product.discountPriceEur : product.discountPrice;
  const currency = isInternational ? "EUR" : "DZD";

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 5);
  const discountPercent = displayDiscountPrice
    ? calculateDiscountPercent(displayPrice, displayDiscountPrice)
    : 0;

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (isOutOfStock) return;
    setAddingToCart(true);
    try {
      await addItem({ productId: product.id, quantity: 1, productData: product });
      toast.success(t("addedToCart"));
    } catch {
      toast.error(t("outOfStock"));
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await toggleItem(product.id);
      toast.success(inWishlist ? t("removedFromWishlist") : t("addedToWishlist"));
    } catch {
      toast.error("Sign in to save items");
    }
  }

  return (
    <Link href={`/shop/${product.slug}`} className={cn("group block", className)}>
      <div
        className="relative overflow-hidden bg-brand-50"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          <Image
            src={getOptimizedImageUrl(product.images[0], 400)}
            alt={product.title}
            fill
            priority={priority}
            className={cn(
              "object-cover transition-all duration-700",
              hovered && product.images[1] ? "opacity-0" : "opacity-100",
              hovered && !isOutOfStock ? "scale-105" : "scale-100"
            )}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.images[1] && !isOutOfStock && (
            <Image
              src={getOptimizedImageUrl(product.images[1], 400)}
              alt={product.title}
              fill
              className={cn(
                "object-cover transition-all duration-700 absolute inset-0",
                hovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
              <span className="bg-black text-white text-[9px] uppercase tracking-[0.3em] px-3 py-1.5">
                {tShop("outOfStock")}
              </span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5 z-20">
          {discountPercent > 0 && !isOutOfStock && (
            <span className="bg-red-600 text-white text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 font-medium">
              -{discountPercent}%
            </span>
          )}
          {product.newArrival && !isOutOfStock && (
            <span className="bg-brand-900 text-white text-[8px] uppercase tracking-[0.2em] px-2 py-0.5">
              {tShop("new")}
            </span>
          )}
          {product.bestseller && !isOutOfStock && (
            <span className="bg-soft-gold/90 text-white text-[8px] uppercase tracking-[0.2em] px-2 py-0.5">
              ✦ {tShop("bestseller")}
            </span>
          )}
          {isLowStock && !isOutOfStock && (
            <span className="bg-amber-500 text-white text-[8px] uppercase tracking-[0.2em] px-2 py-0.5">
              {t("lowStock", { count: product.stock })}
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={cn(
            "absolute top-3 end-3 z-20 p-2 bg-white/80 backdrop-blur-sm rounded-full transition-all duration-200 shadow-sm",
            inWishlist ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
          aria-label={inWishlist ? t("removedFromWishlist") : t("addedToWishlist")}
        >
          <Heart
            className={cn(
              "w-3.5 h-3.5 transition-colors",
              inWishlist ? "fill-red-500 text-red-500" : "text-brand-900"
            )}
          />
        </button>

        {/* Quick add to cart */}
        {!isOutOfStock && (
          <div className={cn(
            "absolute bottom-0 start-0 end-0 z-20 transition-all duration-300",
            hovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full bg-black text-white py-3 text-[9px] uppercase tracking-[0.25em] font-semibold hover:bg-neutral-900 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-3 h-3" />
              {addingToCart ? t("adding") : t("addToCart")}
            </button>
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="pt-4 space-y-1.5 text-center">
        {(product.avgRating ?? 0) > 0 && (
          <div className="flex items-center justify-center gap-1">
            <Star className="w-3 h-3 fill-soft-gold text-soft-gold" />
            <span className="text-[10px] text-brand-400">{product.avgRating?.toFixed(1)}</span>
            {product.reviewCount && (
              <span className="text-[10px] text-brand-300">({product.reviewCount})</span>
            )}
          </div>
        )}

        {(() => {
          const isArabic = /[\u0600-\u06FF]/.test(product.title);
          return (
            <h3 className={cn(
              "line-clamp-1 px-2 transition-colors duration-200 font-semibold text-center w-full",
              isArabic 
                ? "text-[13px] md:text-[15px] font-arabic tracking-normal text-brand-900 leading-relaxed" 
                : "text-[10px] md:text-[12px] uppercase tracking-[0.1em] text-brand-900 group-hover:text-soft-gold",
              isOutOfStock && "text-brand-300"
            )}>
              {product.title}
            </h3>
          );
        })()}

        <div className="flex items-center justify-center gap-2 mt-1">
          {displayDiscountPrice ? (
            <>
              <span className={cn("text-xs md:text-sm font-semibold", isOutOfStock ? "text-brand-300" : "text-brand-900")}>
                {formatPrice(displayDiscountPrice, currency)}
              </span>
              <span className="text-[10px] md:text-xs text-brand-400 line-through font-normal">
                {formatPrice(displayPrice, currency)}
              </span>
            </>
          ) : (
            <span className={cn("text-xs md:text-sm font-semibold", isOutOfStock ? "text-brand-300" : "text-brand-900")}>
              {formatPrice(displayPrice, currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
