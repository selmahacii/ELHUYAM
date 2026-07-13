"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Heart, Star,
  Check, ChevronRight, Minus, Plus, AlertTriangle, Send, Loader2, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, calculateDiscountPercent, formatDate, getInitials } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useTranslations, useLocale } from "next-intl";

const categoryTranslations: Record<string, string> = {
  "abaya": "عبايات",
  "abayas": "عبايات",
  "hijab": "حجابات",
  "hijabs": "حجابات",
  "khimar": "خمارات",
  "khimars": "خمارات",
  "niqab": "نقاب",
  "niqabs": "نقاب",
  "gloves": "قفازات",
  "gants": "قفازات",
  "accessories": "إكسسوارات",
  "accessoires": "إكسسوارات",
};

interface Review {
  id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  name?: string | null;
  verified: boolean;
  createdAt: Date;
  user?: { name?: string | null; image?: string | null } | null;
}

interface Variant {
  id: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  image?: string | null;
  stock: number;
  price?: number | null;
  priceEur?: number | null;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  priceEur: number;
  discountPriceEur?: number | null;
  images: string[];
  stock: number;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  avgRating: number;
  reviewCount: number;
  tags: string[];
  category: { name: string; slug: string };
  variants: Variant[];
  reviews: Review[];
  lowStockThreshold?: number | null;
}

import { useRegion } from "@/providers/region-provider";

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedImage, setSelectedImage] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    name: "",
    title: "",
    comment: "",
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error(t("toastCommentRequired"));
      return;
    }
    if (reviewForm.comment.trim().length < 5) {
      toast.error(t("toastMinChars"));
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          rating: reviewForm.rating,
          name: reviewForm.name.trim() || null,
          title: reviewForm.title.trim() || null,
          comment: reviewForm.comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || data.error || t("toastError"));
      } else {
        toast.success(t("toastSuccess"));
        setReviewSubmitted(true);
        setReviewForm({
          rating: 5,
          name: "",
          title: "",
          comment: "",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toastNetworkError"));
    } finally {
      setSubmittingReview(false);
    }
  };

  // Default to first in-stock variant, or first variant globally
  const initialVariant = product.variants.find((v) => v.stock > 0) || product.variants[0] || null;

  const [selectedSize, setSelectedSize] = useState<string | null>(initialVariant?.size ?? null);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialVariant?.color ?? null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(initialVariant ?? null);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);
  const t = useTranslations("product");
  const tShop = useTranslations("shop");
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const { region } = useRegion();

  const isInternational = region === "INTERNATIONAL";
  const currency = isInternational ? "EUR" : "DZD";

  const translateCategoryName = (name: string) => {
    if (locale !== "ar") return name;
    const key = name.toLowerCase().trim();
    return categoryTranslations[key] ?? name;
  };

  // All unique sizes and colors available globally
  const sizes = [...new Set(product.variants.filter((v) => v.size).map((v) => v.size!))];
  const colors = [...new Set(product.variants.filter((v) => v.color).map((v) => v.color!))];

  const basePrice = isInternational ? (product.priceEur || 0) : product.price;
  const baseDiscountPrice = isInternational ? product.discountPriceEur : product.discountPrice;
  const variantPrice = selectedVariant ? (isInternational ? selectedVariant.priceEur : selectedVariant.price) : null;
  const effectivePrice = variantPrice ?? baseDiscountPrice ?? basePrice;
  
  const discountPercent = baseDiscountPrice
    ? calculateDiscountPercent(basePrice, baseDiscountPrice)
    : 0;

  const hasVariants = product.variants.length > 0;
  const effectiveStock = selectedVariant
    ? selectedVariant.stock
    : hasVariants
    ? null
    : product.stock;

  // Get all unique variant images
  const uniqueVariantImages = [
    ...new Set(product.variants.map((v) => v.image).filter(Boolean)),
  ] as string[];

  const displayImages = [
    ...product.images,
    ...uniqueVariantImages.filter((img) => !product.images.includes(img)),
  ];
  const currentImage = displayImages[selectedImage] ?? displayImages[0] ?? "/placeholder-product.jpg";

  function findVariant(size: string | null, color: string | null): Variant | null {
    return (
      product.variants.find(
        (v) =>
          (size ? v.size === size : true) &&
          (color ? v.color === color : true) &&
          (size || color)
      ) ?? null
    );
  }

  function selectSize(size: string) {
    const nextSize = size === selectedSize ? null : size;
    setSelectedSize(nextSize);

    // If selected size is incompatible with current color, intelligently switch color to a compatible one
    if (nextSize && selectedColor) {
      const hasCombination = product.variants.some(
        (v) => v.size === nextSize && v.color === selectedColor
      );
      if (!hasCombination) {
        const compatibleColor =
          product.variants.find((v) => v.size === nextSize && v.stock > 0)?.color ??
          product.variants.find((v) => v.size === nextSize)?.color ??
          null;
        setSelectedColor(compatibleColor);
        const nextVar = findVariant(nextSize, compatibleColor);
        setSelectedVariant(nextVar);
        if (nextVar?.image) {
          const idx = displayImages.indexOf(nextVar.image);
          if (idx !== -1) setSelectedImage(idx);
        } else {
          setSelectedImage(0);
        }
        return;
      }
    }

    const nextVar = findVariant(nextSize, selectedColor);
    setSelectedVariant(nextVar);
    if (nextVar?.image) {
      const idx = displayImages.indexOf(nextVar.image);
      if (idx !== -1) setSelectedImage(idx);
    } else {
      setSelectedImage(0);
    }
  }

  function selectColor(color: string) {
    const nextColor = color === selectedColor ? null : color;
    setSelectedColor(nextColor);

    // If selected color is incompatible with current size, intelligently switch size to a compatible one
    if (nextColor && selectedSize) {
      const hasCombination = product.variants.some(
        (v) => v.size === selectedSize && v.color === nextColor
      );
      if (!hasCombination) {
        const compatibleSize =
          product.variants.find((v) => v.color === nextColor && v.stock > 0)?.size ??
          product.variants.find((v) => v.color === nextColor)?.size ??
          null;
        setSelectedSize(compatibleSize);
        const nextVar = findVariant(compatibleSize, nextColor);
        setSelectedVariant(nextVar);
        if (nextVar?.image) {
          const idx = displayImages.indexOf(nextVar.image);
          if (idx !== -1) setSelectedImage(idx);
        } else {
          setSelectedImage(0);
        }
        return;
      }
    }

    const nextVar = findVariant(selectedSize, nextColor);
    setSelectedVariant(nextVar);
    if (nextVar?.image) {
      const idx = displayImages.indexOf(nextVar.image);
      if (idx !== -1) setSelectedImage(idx);
    } else {
      setSelectedImage(0);
    }
  }

  const isOutOfStock = effectiveStock !== null ? effectiveStock === 0 : product.stock === 0;
  const needsVariantSelection = hasVariants && !selectedVariant;
  const maxQty = effectiveStock ?? product.stock;

  async function handleAddToCart() {
    if (isOutOfStock) return;
    if (needsVariantSelection) {
      toast.error(t("selectVariant"));
      return;
    }
    setAddingToCart(true);
    try {
      await addItem({
        productId: product.id,
        quantity,
        size: selectedSize,
        color: selectedColor,
        variantId: selectedVariant?.id,
        productData: product,
      });
      toast.success(t("addedToCart"));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("outOfStock"));
    } finally {
      setAddingToCart(false);
    }
  }

  async function handleWishlist() {
    try {
      await toggleItem(product.id);
      toast.success(inWishlist ? t("removedFromWishlist") : t("addedToWishlist"));
    } catch {
      toast.error("Sign in to save items");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back button */}
      <div className="mb-6 flex justify-start">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/shop");
            }
          }}
          className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-700 hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />
          <span>{locale === "ar" ? "رجوع" : "Retour"}</span>
        </button>
      </div>

      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs uppercase tracking-widest rtl:tracking-normal rtl:normal-case text-brand-600 font-medium mb-8">
        <Link href="/" className="hover:text-black transition-colors">{tCommon("home")}</Link>
        <ChevronRight className="w-3 h-3 shrink-0 text-brand-400 rtl:rotate-180" />
        <Link href="/shop" className="hover:text-black transition-colors">{tNav("shop")}</Link>
        <ChevronRight className="w-3 h-3 shrink-0 text-brand-400 rtl:rotate-180" />
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-black transition-colors">
          {translateCategoryName(product.category.name)}
        </Link>
        <ChevronRight className="w-3 h-3 shrink-0 text-brand-400 rtl:rotate-180" />
        <span className="text-brand-900 font-semibold truncate max-w-[180px] sm:max-w-xs">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
        {/* Images */}
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden bg-brand-50">
            <Image
              src={currentImage}
              alt={product.title}
              fill
              priority
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {discountPercent > 0 && (
              <div className="absolute top-4 start-4 bg-red-600 text-white text-xs px-2 py-1 font-medium">
                -{discountPercent}%
              </div>
            )}
            {product.newArrival && (
              <div className="absolute top-4 end-4 bg-brand-900 text-white text-xs px-2 py-1 tracking-widest uppercase">
                {tShop("new")}
              </div>
            )}
          </div>

          {displayImages.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {displayImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "aspect-square relative overflow-hidden border-2 transition-colors",
                    selectedImage === i ? "border-brand-900" : "border-transparent hover:border-brand-300"
                  )}
                >
                  <Image src={img} alt={`${product.title} ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-5">
          <div>
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="text-xs uppercase tracking-[0.25em] rtl:tracking-normal text-neutral-500 hover:text-black font-semibold transition-colors"
            >
              {translateCategoryName(product.category.name)}
            </Link>
            <h1 className="font-display text-3xl md:text-4xl text-black font-bold mt-2 leading-tight">
              {product.title}
            </h1>
          </div>

          {product.reviewCount > 0 && (
            <button className="flex items-center gap-2 group">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "w-4 h-4",
                      s <= Math.round(product.avgRating) ? "fill-soft-gold text-soft-gold" : "text-brand-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-500 group-hover:text-black transition-colors">
                ({t("reviewCount", { count: product.reviewCount })})
              </span>
            </button>
          )}

          <div className="flex items-baseline gap-3">
            <span className="font-display text-2xl text-black font-bold">{formatPrice(effectivePrice, currency)}</span>
            {baseDiscountPrice && !variantPrice && (
              <span className="text-base text-neutral-400 line-through font-normal">{formatPrice(basePrice, currency)}</span>
            )}
          </div>

          <StockAlert
            effectiveStock={effectiveStock}
            productStock={product.stock}
            hasVariants={hasVariants}
            selectedVariant={selectedVariant}
            lowStockThreshold={product.lowStockThreshold}
          />

          <div className="pt-2 pb-2">
            <p className="text-base text-neutral-800 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>

          {/* Size Selectors (Dashed border if incompatible with active color) */}
          {sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-black font-semibold">{t("size")}</span>
                {selectedSize && <span className="text-xs text-neutral-600 font-medium">{selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                  const sizeVariant = product.variants.find(
                    (v) => v.size === size && (!selectedColor || v.color === selectedColor)
                  );
                  const existsGlobally = product.variants.some((v) => v.size === size);
                  const outOfStock = sizeVariant ? sizeVariant.stock === 0 : !existsGlobally;
                  const isCompatible = sizeVariant !== undefined;

                  return (
                    <button
                      key={size}
                      onClick={() => !outOfStock && selectSize(size)}
                      disabled={outOfStock}
                      className={cn(
                        "min-w-[44px] h-11 px-3 border text-sm transition-all duration-150 font-medium",
                        selectedSize === size
                          ? "bg-black text-white border-black font-bold"
                          : !isCompatible
                          ? "border-dashed border-neutral-300 text-neutral-400 hover:border-black hover:text-neutral-800"
                          : "border-neutral-200 text-neutral-800 hover:border-black",
                        outOfStock && "opacity-30 cursor-not-allowed"
                      )}
                      title={!isCompatible ? "Changer de couleur pour cette taille" : undefined}
                    >
                      {outOfStock ? <s>{size}</s> : size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selectors (Dashed border if incompatible with active size) */}
          {colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-black font-semibold">{t("color")}</span>
                {selectedColor && <span className="text-xs text-neutral-600 font-medium">{selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                {colors.map((color) => {
                  const colorVariant = product.variants.find(
                    (v) => v.color === color && (!selectedSize || v.size === selectedSize)
                  );
                  const existsGlobally = product.variants.some((v) => v.color === color);
                  const outOfStock = colorVariant ? colorVariant.stock === 0 : !existsGlobally;
                  const isCompatible = colorVariant !== undefined;
                  const hex = colorVariant?.colorHex ?? product.variants.find(v => v.color === color)?.colorHex ?? "#ccc";

                  return (
                    <button
                      key={color}
                      onClick={() => !outOfStock && selectColor(color)}
                      disabled={outOfStock}
                      title={!isCompatible ? `${color} (Changer de taille)` : color}
                      className={cn(
                        "relative w-9 h-9 rounded-full border-2 transition-all",
                        selectedColor === color
                          ? "border-black scale-110 shadow-md"
                          : !isCompatible
                          ? "border-dashed border-neutral-300 opacity-60 hover:border-neutral-400"
                          : "border-neutral-200/80 hover:border-neutral-400",
                        outOfStock && "opacity-30 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: hex }}
                    >
                      {selectedColor === color && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white drop-shadow" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedVariant?.image && (
                <p className="text-xs text-neutral-500 mt-2">{t("colorImageUpdated")}</p>
              )}
            </div>
          )}

          {!isOutOfStock && (
            <div>
              <span className="text-xs uppercase tracking-widest text-black font-semibold block mb-2">
                {t("quantity")}
              </span>
              <div className="flex items-center gap-0 w-fit border border-neutral-200">
                <button className="qty-btn hover:text-black" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-sm font-semibold text-black">{quantity}</span>
                <button
                  className="qty-btn hover:text-black"
                  onClick={() => setQuantity(Math.min(maxQty, quantity + 1))}
                  disabled={quantity >= maxQty}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="luxury"
              size="lg"
              className={cn(
                "flex-1 h-14 font-semibold tracking-[0.2em] text-xs uppercase transition-all duration-300 rounded-none border border-black",
                needsVariantSelection
                  ? "bg-transparent text-black hover:bg-black hover:text-white cursor-pointer"
                  : "bg-black text-white hover:bg-neutral-900"
              )}
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              loading={addingToCart}
            >
              <ShoppingBag className="w-4 h-4" />
              {isOutOfStock
                ? t("outOfStock")
                : needsVariantSelection
                ? "SELECT SIZE AND COLOR"
                : t("addToCart")}
            </Button>
            <Button
              variant="luxury-outline"
              size="icon"
              onClick={handleWishlist}
              className="h-14 w-14 rounded-none border-black text-black hover:bg-black hover:text-white transition-all duration-300"
            >
              <Heart className={cn("w-5 h-5", inWishlist && "fill-black text-black")} />
            </Button>
          </div>

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {product.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/shop?search=${tag}`}
                  className="text-xs text-brand-500 border border-brand-200 px-3 py-1 hover:border-brand-600 transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-20 border-t border-brand-200 pt-12">
        <div className="grid md:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left: Reviews List */}
          <div className="md:col-span-7 space-y-8">
            <h2 className="font-display text-2xl text-brand-900 tracking-tight flex items-center gap-3">
              <span>{t("reviews")}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">
                {product.reviewCount}
              </span>
            </h2>

            <div className="space-y-6">
              {product.reviews.length === 0 ? (
                <div className="py-8 text-brand-400 text-sm italic">
                  {t("noReviews")}
                </div>
              ) : (
                product.reviews.map((review) => (
                  <div key={review.id} className="border-b border-brand-100 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-xs font-semibold text-brand-700 uppercase">
                          {getInitials(review.user?.name || review.name || t("anonymous"))}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-900">
                            {review.user?.name || review.name || t("anonymous")}
                          </p>
                          <p className="text-[10px] text-brand-400 font-medium">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "w-3.5 h-3.5",
                              s <= review.rating ? "fill-soft-gold text-soft-gold" : "text-brand-200"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && (
                      <p className="text-sm font-semibold text-brand-900 mb-1">{review.title}</p>
                    )}
                    {review.comment && (
                      <p className="text-sm text-brand-600 leading-relaxed font-medium">{review.comment}</p>
                    )}
                    {review.verified && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-green-600 font-semibold">
                        <Check className="w-3.5 h-3.5" /> {t("verifiedPurchase")}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Write a Review Form */}
          <div className="md:col-span-5">
            <div className="bg-brand-50/60 border border-brand-100 p-6 sm:p-8 backdrop-blur-xs">
              {reviewSubmitted ? (
                <div className="text-center py-8 space-y-4">
                  <span className="text-soft-gold text-3xl block animate-bounce">✦</span>
                  <h3 className="font-display text-xl text-brand-900 font-semibold">
                    {t("successHeader")}
                  </h3>
                  <p className="text-xs text-brand-600 leading-relaxed max-w-xs mx-auto">
                    {t("successSub")}
                  </p>
                  <button
                    onClick={() => setReviewSubmitted(false)}
                    className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand-700 hover:text-soft-gold transition-colors border-b border-brand-300 hover:border-soft-gold pb-0.5"
                  >
                    {t("writeAnother")}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display text-lg text-brand-900 font-semibold">
                      {t("shareYourReview")}
                    </h3>
                    <p className="text-xs text-brand-400 mt-1">
                      {session 
                        ? t("loggedInAs", { name: session.user.name || t("anonymous") }) 
                        : t("publicReviewGuest")}
                    </p>
                  </div>

                  <form onSubmit={handleReviewSubmit} className="space-y-5">
                     {/* Star Rating Input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-500">
                        {t("overallRating")} <span className="text-red-500">*</span>
                      </label>
                      <StarRatingInput
                        value={reviewForm.rating}
                        onChange={(v) => setReviewForm((prev) => ({ ...prev, rating: v }))}
                      />
                    </div>

                    {/* Guest Name input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-500">
                        {t("yourName")} <span className="text-brand-300 normal-case font-normal">{t("optional")}</span>
                      </label>
                      <input
                        type="text"
                        maxLength={100}
                        placeholder={t("guestPlaceholder")}
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-white border border-brand-200 px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:border-soft-gold transition-colors rounded-none"
                      />
                    </div>

                    {/* Title input */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-500">
                        {t("reviewTitle")} <span className="text-brand-300 normal-case font-normal">{t("optional")}</span>
                      </label>
                      <input
                        type="text"
                        maxLength={150}
                        placeholder={t("titlePlaceholder")}
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full bg-white border border-brand-200 px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:border-soft-gold transition-colors rounded-none"
                      />
                    </div>

                    {/* Detailed Comment textarea */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-brand-500">
                        {t("detailedComment")} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        minLength={5}
                        maxLength={2000}
                        rows={4}
                        placeholder={t("commentPlaceholder")}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                        className="w-full bg-white border border-brand-200 px-3 py-2 text-sm text-brand-900 placeholder:text-brand-300 focus:outline-none focus:border-soft-gold transition-colors resize-none rounded-none"
                      />
                      <div className="flex justify-between items-center text-[10px] text-brand-300 mt-1 font-semibold">
                        <span>{t("minChars")}</span>
                        <span>{reviewForm.comment.length} / 2000</span>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingReview || reviewForm.comment.trim().length < 5}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-black text-white hover:bg-neutral-900 transition-colors duration-300 text-xs font-semibold uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingReview ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {t("submitting")}
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          {t("submitReview")}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

function StockAlert({
  effectiveStock,
  productStock,
  hasVariants,
  selectedVariant,
  lowStockThreshold,
}: {
  effectiveStock: number | null;
  productStock: number;
  hasVariants: boolean;
  selectedVariant: Variant | null;
  lowStockThreshold?: number | null;
}) {
  const t = useTranslations("product");
  const threshold = lowStockThreshold ?? 5;

  if (!hasVariants) {
    if (productStock === 0) {
      return (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {t("outOfStock")}
        </div>
      );
    }
    if (productStock <= threshold) {
      return (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {t("lowStock", { count: productStock })}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-sm text-green-600">
        <Check className="w-4 h-4" /> {t("inStock")}
      </div>
    );
  }

  if (!selectedVariant) {
    return (
      <div className="text-xs text-brand-400 bg-brand-50 border border-brand-100 px-4 py-2.5">
        {t("selectVariantAvailability")}
      </div>
    );
  }

  const stock = selectedVariant.stock;
  if (stock === 0) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {t("outOfStockVariant")}
      </div>
    );
  }
  if (stock <= threshold) {
    return (
      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-700">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {t("lowStock", { count: stock })}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 text-sm text-green-600">
      <Check className="w-4 h-4" /> {t("inStock")}
    </div>
  );
}

function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          type="button"
          key={s}
          className="transition-transform duration-150 hover:scale-110 focus:outline-none"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              s <= (hovered || value) ? "fill-soft-gold text-soft-gold" : "text-brand-200"
            )}
          />
        </button>
      ))}
    </div>
  );
}
