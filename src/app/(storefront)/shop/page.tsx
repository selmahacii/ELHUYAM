import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import ProductCard from "@/components/shop/product-card";
import ShopFilters from "@/components/shop/shop-filters";
import MobileFilters from "@/components/shop/mobile-filters";
import SortSelect from "@/components/shop/sort-select";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import CatalogReviews from "@/components/shop/catalog-reviews";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";

export const metadata: Metadata = { title: "EL HUYAM" };

// Categories change rarely — cache the slug -> {id, subCategories} lookup so
// browsing a category doesn't cost an extra DB round-trip on every request.
const getCategoryBySlug = unstable_cache(
  async (slug: string) =>
    db.category.findUnique({
      where: { slug },
      include: { subCategories: { orderBy: { sortOrder: "asc" } } },
    }),
  ["shop-category-by-slug"],
  { revalidate: 300, tags: ["categories"] }
);

interface ShopPageProps {
  searchParams: Promise<{
    category?: string;
    search?: string;
    minPrice?: string;
    maxPrice?: string;
    featured?: string;
    bestseller?: string;
    newArrival?: string;
    sale?: string;
    sortBy?: string;
    page?: string;
  }>;
}

async function ProductGrid({ searchParams }: { searchParams: Awaited<ShopPageProps["searchParams"]> }) {
  const {
    category, search, minPrice, maxPrice,
    featured, bestseller, newArrival, sale, sortBy = "createdAt",
  } = searchParams;

  const page = Math.max(1, Math.min(Number(searchParams.page ?? 1), 500));
  const limit = 24;
  const skip = (page - 1) * limit;
  // Sanitise search — prevent abuse with very long strings
  const safeSearch = search?.slice(0, 100);

  // Resolve active category and all its subcategories
  let categoryIds: string[] = [];
  let subCategories: any[] = [];
  let categoryName = "";
  
  if (category) {
    const activeCat = await getCategoryBySlug(category);

    if (activeCat) {
      categoryIds = [activeCat.id, ...activeCat.subCategories.map((c: any) => c.id)];
      subCategories = activeCat.subCategories;
      categoryName = activeCat.name;
    }
  }

  const where = {
    archived: false,
    ...(category ? { categoryId: { in: categoryIds } } : {}),
    ...(safeSearch ? {
      OR: [
        { title: { contains: safeSearch } },
        { description: { contains: safeSearch } },
      ],
    } : {}),
    ...(featured === "true" ? { featured: true } : {}),
    ...(bestseller === "true" ? { bestseller: true } : {}),
    ...(newArrival === "true" ? { newArrival: true } : {}),
    ...(sale === "true" ? { discountPrice: { not: null } } : {}),
    ...(minPrice || maxPrice ? {
      price: {
        ...(minPrice ? { gte: Number(minPrice) } : {}),
        ...(maxPrice ? { lte: Number(maxPrice) } : {}),
      },
    } : {}),
  };

  const orderBy =
    sortBy === "price-asc"  ? { price: "asc" as const } :
    sortBy === "price-desc" ? { price: "desc" as const } :
    sortBy === "rating"     ? { avgRating: "desc" as const } :
    { createdAt: "desc" as const };

  const [products, total, t, locale] = await Promise.all([
    db.product.findMany({ where, include: { category: true }, orderBy, skip, take: limit }),
    db.product.count({ where }),
    getTranslations("shop"),
    getLocale(),
  ]);

  const isAr = locale === "ar";

  const totalPages = Math.ceil(total / limit);

  const preservedParams = [
    category    && `category=${category}`,
    search      && `search=${encodeURIComponent(search)}`,
    minPrice    && `minPrice=${minPrice}`,
    maxPrice    && `maxPrice=${maxPrice}`,
    featured    && `featured=${featured}`,
    bestseller  && `bestseller=${bestseller}`,
    newArrival  && `newArrival=${newArrival}`,
    sale        && `sale=${sale}`,
    sortBy !== "createdAt" && `sortBy=${sortBy}`,
  ].filter(Boolean).join("&");

  return (
    <div>
      {/* Subcategories visual navigation */}
      {subCategories.length > 0 && (
        <div className="mb-10 pb-8 border-b border-brand-100">
          <div className="flex flex-col mb-6">
            <h2 className={`font-display text-brand-900 mb-1 ${isAr ? "not-italic font-bold text-2xl md:text-3xl text-black leading-tight" : "italic text-lg md:text-xl"}`}>
              {t("subcollectionsOf", { category: categoryName || t("thisCategory") })}
            </h2>
            <p className="text-[10px] uppercase tracking-widest text-brand-400">
              {t("refineByType")}
            </p>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-brand-200">
            {subCategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/shop?category=${sub.slug}`}
                className="group flex flex-col items-center gap-2 shrink-0"
              >
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-md overflow-hidden border border-brand-100 group-hover:border-soft-gold bg-warm-white transition-all duration-300 shadow-sm hover:shadow-md">
                  {sub.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sub.image}
                      alt={sub.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-brand-50 flex items-center justify-center text-brand-300 font-display italic text-xs">
                      {sub.name[0]}
                    </div>
                  )}
                </div>
                <span className="font-display italic text-xs md:text-sm text-brand-900 group-hover:text-soft-gold transition-colors font-medium">
                  {sub.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Results bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-100">
        <p className="text-xs text-brand-500 tracking-wider uppercase">
          <span className="font-semibold text-brand-900 text-sm">{total}</span>{" "}
          {total <= 1 ? t("piece") : t("pieces")}
          {search && <span className="normal-case"> {t("forQuery", { query: search })}</span>}
        </p>
        <SortSelect current={sortBy} />
      </div>

      {products.length === 0 ? (
        <div className="py-24 text-center arabesque-bg">
          <span className="text-soft-gold text-2xl mb-4 block">✦</span>
          <p className="font-display text-2xl text-brand-900 mb-3">{t("noResults")}</p>
          <p className="text-brand-400 text-sm mb-6">{t("noProductsHint")}</p>
          <Link
            href="/shop"
            className="inline-block text-[10px] uppercase tracking-[0.25em] text-brand-700 hover:text-soft-gold border-b border-brand-300 hover:border-soft-gold pb-0.5 transition-all duration-300"
          >
            {t("clearAllFilters")}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product: (typeof products)[number], i: number) => (
            <div key={product.id} className="grid-item-enter">
              <ProductCard product={product} priority={i < 8} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-1.5 mt-14">
          {page > 1 && (
            <Link
              href={`?page=${page - 1}${preservedParams ? `&${preservedParams}` : ""}`}
              className="w-10 h-10 flex items-center justify-center text-sm border border-brand-200 text-brand-700 hover:border-soft-gold hover:text-soft-gold transition-all"
            >
              ‹
            </Link>
          )}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
            .map((p, idx, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {idx > 0 && arr[idx - 1] !== p - 1 && (
                  <span className="w-10 h-10 flex items-center justify-center text-brand-300">…</span>
                )}
                <Link
                  href={`?page=${p}${preservedParams ? `&${preservedParams}` : ""}`}
                  className={`w-10 h-10 flex items-center justify-center text-sm border transition-all ${
                    p === page
                      ? "bg-black text-white border-black"
                      : "border-brand-200 text-brand-700 hover:border-soft-gold hover:text-soft-gold"
                  }`}
                >
                  {p}
                </Link>
              </span>
            ))}
          {page < totalPages && (
            <Link
              href={`?page=${page + 1}${preservedParams ? `&${preservedParams}` : ""}`}
              className="w-10 h-10 flex items-center justify-center text-sm border border-brand-200 text-brand-700 hover:border-soft-gold hover:text-soft-gold transition-all"
            >
              ›
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const [categories, t, locale] = await Promise.all([
    db.category.findMany({
      where: { parentId: null },
      orderBy: { sortOrder: "asc" },
    }),
    getTranslations("shop"),
    getLocale(),
  ]);

  const isAr = locale === "ar";

  const categoryName = params.category
    ? categories.find((c: (typeof categories)[number]) => c.slug === params.category)?.name
    : null;

  const pageTitle =
    categoryName ? categoryName :
    params.sale === "true" ? t("sale") :
    params.newArrival === "true" ? t("new") :
    params.bestseller === "true" ? t("bestseller") :
    params.search ? `"${params.search}"` :
    t("allProducts");

  return (
    <div className="min-h-screen">
      {/* Page header with Islamic ornament */}
      <div className="bg-brand-50 border-b border-brand-100 arabesque-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          {/* Ornament divider */}
          <div className="ornament-divider max-w-xs mx-auto mb-6">
            <span className="text-soft-gold text-xs">✦</span>
          </div>

          {/* Back to Home Button */}
          <div className="mb-4 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.2em] font-semibold text-brand-700 hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
              <span>{isAr ? "الرئيسية" : "Retour"}</span>
            </Link>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.3em] text-brand-400 mb-4">
            <Link href="/shop" className="hover:text-soft-gold transition-colors">{t("breadcrumbBoutique")}</Link>
            {categoryName && (
              <>
                <span>›</span>
                <span className="text-brand-700">{categoryName}</span>
              </>
            )}
            {params.search && (
              <>
                <span>›</span>
                <span className="text-brand-700">{t("breadcrumbSearch")}</span>
              </>
            )}
          </div>

          <h1 className={`font-display text-brand-900 ${isAr ? "text-5xl md:text-6xl text-black font-bold leading-tight" : "text-4xl md:text-5xl font-light"}`}>{pageTitle}</h1>

          {/* Arabic subtitle for special filters */}
          {(params.newArrival === "true" || params.bestseller === "true") && (
            <p className="mt-3 font-arabic text-soft-gold text-lg opacity-80">
              {params.newArrival === "true" ? "وصل حديثاً" : "الأكثر مبيعاً"}
            </p>
          )}

          <div className="ornament-divider max-w-xs mx-auto mt-6">
            <span className="text-soft-gold text-xs">✦</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-10">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <ShopFilters categories={categories} />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter trigger */}
            <div className="lg:hidden mb-6">
              <MobileFilters categories={categories} />
            </div>

            <Suspense key={JSON.stringify(params)} fallback={<ProductGridSkeleton count={12} />}>
              <ProductGrid searchParams={params} />
            </Suspense>
          </div>
        </div>
      </div>

      <CatalogReviews />
    </div>
  );
}
