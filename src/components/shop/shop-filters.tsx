"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

interface Category { id: string; name: string; slug: string }
interface ShopFiltersProps { categories: Category[]; onFilterChange?: () => void }

const PRICE_RANGES = [
  { label: "Under 2,000 DZD", labelAr: "أقل من 2,000 د.ج", min: 0, max: 2000 },
  { label: "2,000 – 5,000 DZD", labelAr: "2,000 – 5,000 د.ج", min: 2000, max: 5000 },
  { label: "5,000 – 10,000 DZD", labelAr: "5,000 – 10,000 د.ج", min: 5000, max: 10000 },
  { label: "10,000+ DZD", labelAr: "+10,000 د.ج", min: 10000, max: 999999 },
];

const QUICK_FILTERS = [
  { label: "New Arrivals", arabic: "جديد", key: "newArrival", value: "true" },
  { label: "Best Sellers", arabic: "الأكثر مبيعاً", key: "bestseller", value: "true" },
  { label: "Sale", arabic: "تخفيضات", key: "sale", value: "true" },
  { label: "Featured", arabic: "مميز", key: "featured", value: "true" },
];

export default function ShopFilters({ categories, onFilterChange }: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      router.refresh();
      onFilterChange?.();
    },
    [router, pathname, searchParams, onFilterChange]
  );

  const activeCategory = searchParams.get("category");
  const activeMin = searchParams.get("minPrice");
  const activeMax = searchParams.get("maxPrice");
  const hasFilters = searchParams.toString().length > 0;

  function clearAll() {
    router.push(pathname, { scroll: false });
    router.refresh();
    onFilterChange?.();
  }

  return (
    <div className="space-y-8">
      {/* Header ornament */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-[0.25em] text-black font-semibold">
          {locale === "ar" ? "الفلاتر" : "Filters"}
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-soft-gold/30 to-transparent" />
        <span className="text-soft-gold text-[8px]">✦</span>
      </div>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-[10px] uppercase tracking-[0.2em] text-black/70 hover:text-black transition-colors border-b border-black/30 pb-1"
        >
          {locale === "ar" ? "مسح الكل" : "Clear All"}
        </button>
      )}

      {/* Categories */}
      <div>
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-black font-semibold mb-4 flex items-center gap-2">
          <span className="text-soft-gold text-[7px]">◆</span> {locale === "ar" ? "الفئة" : "Category"}
        </h3>
        <ul className="space-y-2.5">
          <li>
            <button
              onClick={() => updateParam("category", null)}
              className={cn(
                "text-sm transition-all duration-200 flex items-center gap-2 w-full group",
                !activeCategory
                  ? "text-black font-semibold"
                  : "text-black/60 hover:text-black"
              )}
            >
              <span className={cn(
                "w-1.5 h-1.5 rounded-full transition-colors",
                !activeCategory ? "bg-soft-gold" : "bg-black/10 group-hover:bg-soft-gold"
              )} />
              {locale === "ar" ? "كل القطع" : "All Items"}
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => updateParam("category", activeCategory === cat.slug ? null : cat.slug)}
                className={cn(
                  "text-sm transition-all duration-200 flex items-center gap-2 w-full group",
                  activeCategory === cat.slug
                    ? "text-black font-semibold"
                    : "text-black/60 hover:text-black"
                )}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  activeCategory === cat.slug ? "bg-soft-gold" : "bg-black/10 group-hover:bg-soft-gold"
                )} />
                {cat.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-soft-gold/20 via-soft-gold/40 to-soft-gold/20" />

      {/* Price */}
      <div>
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-black font-semibold mb-4 flex items-center gap-2">
          <span className="text-soft-gold text-[7px]">◆</span> {locale === "ar" ? "السعر" : "Price"}
        </h3>
        <ul className="space-y-2.5">
          {PRICE_RANGES.map((range) => {
            const isActive = activeMin === String(range.min) && activeMax === String(range.max);
            return (
              <li key={range.label}>
                <button
                  onClick={() => {
                    if (isActive) {
                      updateParam("minPrice", null);
                      updateParam("maxPrice", null);
                    } else {
                      updateParam("minPrice", String(range.min));
                      updateParam("maxPrice", String(range.max));
                    }
                  }}
                  className={cn(
                    "text-sm transition-all duration-200 flex items-center gap-2 w-full group",
                    isActive ? "text-black font-semibold" : "text-black/60 hover:text-black"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full transition-colors",
                    isActive ? "bg-soft-gold" : "bg-black/10 group-hover:bg-soft-gold"
                  )} />
                  {locale === "ar" ? range.labelAr : range.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-soft-gold/20 via-soft-gold/40 to-soft-gold/20" />

      {/* Quick filters */}
      <div>
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-black font-semibold mb-4 flex items-center gap-2">
          <span className="text-soft-gold text-[7px]">◆</span> {locale === "ar" ? "فلاتر سريعة" : "Quick Filters"}
        </h3>
        <div className="space-y-2.5">
          {QUICK_FILTERS.map(({ label, arabic, key, value }) => {
            const isActive = searchParams.get(key) === value;
            return (
              <button
                key={key}
                onClick={() => updateParam(key, isActive ? null : value)}
                className={cn(
                  "flex items-center gap-2 w-full group text-left transition-all duration-200",
                  isActive ? "text-black font-semibold" : "text-black/60 hover:text-black"
                )}
              >
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors shrink-0",
                  isActive ? "bg-soft-gold" : "bg-black/10 group-hover:bg-soft-gold"
                )} />
                <span className="text-sm">{label}</span>
                <span className={cn(
                  "font-arabic text-[11px] ml-auto transition-colors",
                  isActive ? "text-black/80 font-semibold" : "text-black/40 group-hover:text-black/60"
                )}>
                  {arabic}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Islamic brand accent */}
      <div className="pt-4 border-t border-brand-100 text-center">
        {locale === "ar" ? (
          <p className="font-arabic text-soft-gold text-sm opacity-80">الحشمة والأناقة</p>
        ) : (
          <p className="font-display italic text-soft-gold text-xs tracking-widest opacity-80 uppercase">
            Modesty & Elegance
          </p>
        )}
      </div>
    </div>
  );
}
