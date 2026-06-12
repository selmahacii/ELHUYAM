import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import ProductCard from "@/components/shop/product-card";
import { ProductGridSkeleton } from "@/components/ui/skeleton";
import { getLocale, getTranslations } from "next-intl/server";

type ProductItem = {
  id: string; title: string; slug: string; price: number;
  discountPrice: number | null; images: string[]; stock: number;
  featured: boolean; bestseller: boolean; newArrival: boolean;
};
type CategoryItem = { name: string; slug: string; image: string | null };

async function getFeaturedProducts() {
  return db.product.findMany({
    where: { featured: true, archived: false },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

async function getFeaturedCategories() {
  const categories = await db.category.findMany({
    where: { featured: true, parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });
  
  if (categories.length > 0) return categories;

  // Fallback: if no categories are featured, just return the first 4 categories
  return db.category.findMany({
    where: { parentId: null },
    orderBy: { sortOrder: "asc" },
    take: 4,
  });
}

async function getBestsellers() {
  return db.product.findMany({
    where: { bestseller: true, archived: false },
    include: { category: true },
    take: 4,
  });
}

// ── Hero ────────────────────────────────────────────────────────────────────
async function HeroSection() {
  const desktopSetting = await db.setting.findUnique({ where: { key: "hero_desktop_media" } });
  const mobileSetting = await db.setting.findUnique({ where: { key: "hero_mobile_media" } });

  const desktopMedia = desktopSetting?.value || "/hero-mobile.png";
  const mobileMedia = mobileSetting?.value || "/IMG_2121.MOV";

  const isDesktopVideo = ["mp4", "mov", "webm", "ogg", "quicktime"].includes(
    desktopMedia.split("?")[0].split(".").pop()?.toLowerCase() || ""
  ) || desktopMedia.includes("/video/upload/");

  const isMobileVideo = ["mp4", "mov", "webm", "ogg", "quicktime"].includes(
    mobileMedia.split("?")[0].split(".").pop()?.toLowerCase() || ""
  ) || mobileMedia.includes("/video/upload/");

  return (
    <section className="relative h-[65vh] h-[65svh] min-h-[380px] lg:h-[80vh] lg:h-[80svh] lg:min-h-[600px] xl:min-h-[650px] flex items-center justify-center overflow-hidden">
      {/* Background Media */}
      <div className="absolute inset-0 bg-brand-950 overflow-hidden">
        {/* Mobile Background */}
        {isMobileVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/hero-mobile.png"
            className="lg:hidden w-full h-full object-cover opacity-100"
          >
            <source src={mobileMedia} type="video/mp4" />
            <source src={mobileMedia} type="video/quicktime" />
          </video>
        ) : (
          <div className="lg:hidden absolute inset-0">
            <Image
              src={mobileMedia}
              alt="EL HUYAM Mobile"
              fill
              priority
              className="object-cover opacity-100"
              sizes="100vw"
            />
          </div>
        )}

        {/* Desktop/Web Background */}
        {isDesktopVideo ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/hero-mobile.png"
            className="hidden lg:block w-full h-full object-cover opacity-100"
          >
            <source src={desktopMedia} type="video/mp4" />
            <source src={desktopMedia} type="video/quicktime" />
          </video>
        ) : (
          <div className="hidden lg:block absolute inset-0">
            <Image
              src={desktopMedia}
              alt="EL HUYAM Desktop"
              fill
              priority
              className="object-cover opacity-100"
              sizes="100vw"
            />
          </div>
        )}
      </div>

      {/* Brand Typography Overlay - Responsive for all interfaces (mobile, tablet, desktop) */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col items-center gap-3 sm:gap-4 md:gap-6 animate-fade-in select-none">
        <h1 className="text-white font-display text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl uppercase tracking-[0.2em] sm:tracking-[0.25em] font-medium leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
          EL HUYAM
        </h1>
        <p className="text-white/95 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-amiri tracking-wider leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
          الهُياَمْ
        </p>
      </div>

    </section>
  );
}





// ── Categories Grid ─────────────────────────────────────────────────────────
async function CategoriesSection() {
  const [categories, t, locale] = await Promise.all([
    getFeaturedCategories(),
    getTranslations("home.categories"),
    getLocale(),
  ]);
  if (categories.length === 0) return null;

  const isAr = locale === "ar";
  const arabicWords = ["الحشمة", "الجمال", "الأناقة", "الهوية"];

  return (
    <section className="pt-12 pb-24 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-16">
          <span className={`text-[10px] uppercase tracking-[0.5em] mb-2 md:mb-4 block ${isAr ? "text-brand-800 font-bold" : "text-brand-400"}`}>{t("eyebrow")}</span>
          <h2 className={`font-display ${isAr ? "font-bold text-5xl md:text-6xl text-black leading-tight" : "text-4xl md:text-5xl font-light text-brand-900"}`}>
            {isAr ? (
              `${t("title")} ${t("titleItalic")}`
            ) : (
              <>
                {t("title")} <span className="italic font-serif text-brand-600">{t("titleItalic")}</span>
              </>
            )}
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="w-12 h-px bg-brand-200" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.slice(0, 4).map((cat: CategoryItem, i: number) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              className="group relative aspect-[3/4] overflow-hidden bg-brand-50"
            >
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              ) : (
                <div className="absolute inset-0 bg-brand-100" />
              )}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
                <span className="text-9xl font-display" dir="rtl">{arabicWords[i % arabicWords.length]}</span>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-end p-8 text-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <h3 className="font-display text-2xl text-white mb-4">{cat.name}</h3>
                <div className="w-0 group-hover:w-12 h-px bg-white transition-all duration-500 mb-6" />
                <span className="text-[9px] uppercase tracking-[0.2em] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                  {t("discover")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Featured Products ───────────────────────────────────────────────────────
async function FeaturedProductsSection() {
  const [products, t, locale] = await Promise.all([
    getFeaturedProducts(),
    getTranslations("home.featured"),
    getLocale(),
  ]);
  const isAr = locale === "ar";
  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6 text-center md:text-start">
          <div>
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <span className={`text-sm ${isAr ? "text-brand-700" : "text-brand-400"}`}>✦</span>
              <span className={`text-[10px] uppercase tracking-[0.5em] ${isAr ? "text-brand-800 font-bold" : "text-brand-400"}`}>{t("eyebrow")}</span>
            </div>
            <h2 className={`font-display ${isAr ? "font-bold text-5xl md:text-6xl text-black leading-tight" : "text-4xl md:text-5xl font-light text-brand-900"}`}>
              {isAr ? (
                `${t("title")} ${t("titleItalic")}`
              ) : (
                <>
                  {t("title")} <span className="italic font-serif text-brand-600">{t("titleItalic")}</span>
                </>
              )}
            </h2>
          </div>
          <p className="text-brand-700/80 max-w-xs text-sm font-display italic leading-relaxed border-s border-brand-200 ps-4">
            {t("subtitle")}
          </p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300">
            <p className="font-display text-xl text-gray-500 opacity-40">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            {products.map((product: ProductItem, i: number) => (
              <div key={product.id} className="grid-item-enter">
                <ProductCard product={product} priority={i < 4} />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <Link href="/shop" className="group inline-flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.3em] text-brand-900 font-semibold group-hover:text-brand-500 transition-colors">
              {t("viewAll")}
            </span>
            <div className="w-12 h-px bg-brand-900 group-hover:w-24 transition-all duration-500" />
          </Link>
        </div>
      </div>
    </section>
  );
}




// ── Bestsellers ─────────────────────────────────────────────────────────────
async function BestsellersSection() {
  const [products, t, locale] = await Promise.all([
    getBestsellers(),
    getTranslations("home.bestsellers"),
    getLocale(),
  ]);
  if (products.length === 0) return null;

  const isAr = locale === "ar";

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6 text-center md:text-start">
          <div>
            <div className="flex items-center gap-3 justify-center md:justify-start mb-4">
              <span className="text-gold-500 text-sm">✦</span>
              <span className={`text-[10px] uppercase tracking-[0.5em] ${isAr ? "text-brand-800 font-bold" : "text-brand-400"}`}>{t("eyebrow")}</span>
            </div>
            <h2 className={`font-display ${isAr ? "font-bold text-5xl md:text-6xl text-black leading-tight" : "text-4xl md:text-5xl font-light text-brand-900"}`}>
              {isAr ? (
                `${t("title")} ${t("titleItalic")}`
              ) : (
                <>
                  {t("title")} <span className="italic font-serif text-brand-600">{t("titleItalic")}</span>
                </>
              )}
            </h2>
          </div>
          <Link
            href="/shop?bestseller=true"
            className="hidden md:flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-brand-700 hover:text-brand-900 transition-colors font-semibold"
          >
            {t("viewAll")} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {products.map((p: ProductItem) => (
            <div key={p.id} className="grid-item-enter">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <CategoriesSection />
      <Suspense fallback={
        <div className="py-20 bg-brand-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ProductGridSkeleton count={8} />
          </div>
        </div>
      }>
        <FeaturedProductsSection />
      </Suspense>
      <Suspense fallback={null}>
        <BestsellersSection />
      </Suspense>
    </div>
  );
}
