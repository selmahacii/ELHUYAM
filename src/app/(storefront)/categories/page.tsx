import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

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

const translateCategoryName = (name: string, locale: string) => {
  if (locale !== "ar") return name;
  const key = name.toLowerCase().trim();
  return categoryTranslations[key] ?? name;
};

export async function generateMetadata() {
  const t = await getTranslations("categoriesPage");
  return { title: `${t("title")} — EL HUYAM` };
}

export default async function CategoriesPage() {
  const [categories, t, locale] = await Promise.all([
    db.category.findMany({
      where: { parentId: null, slug: { not: "uncategorized" } },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: { where: { archived: false } } } } },
    }),
    getTranslations("categoriesPage"),
    getLocale(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <div className="bg-brand-50 border-b border-brand-100 py-20 text-center relative overflow-hidden arabesque-bg">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 star-pattern opacity-[0.05]" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h1 className="font-display text-4xl md:text-6xl text-black font-light tracking-widest uppercase mb-4 animate-fade-in">
            {locale === "ar" ? t("title") : (
              <>
                {t("title")} <span className="italic font-serif text-black">{t("titleItalic")}</span>
              </>
            )}
          </h1>
          <div className="ornament-divider max-w-xs mx-auto my-6">
            <span className="text-soft-gold text-xs">✦</span>
          </div>
          
          <p className="text-brand-600 max-w-xl mx-auto text-sm md:text-base font-display italic font-light leading-relaxed tracking-wide animate-fade-in">
            “{t("subtitle")}”
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Category grid - 2 columns on mobile/tablet, 3 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((cat: (typeof categories)[number], i: number) => {
            const displayName = translateCategoryName(cat.name, locale);
            return (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="group block relative overflow-hidden bg-brand-50 aspect-[4/5] card-lift"
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={i < 3}
                  />
                ) : (
                  <div className="absolute inset-0 arabesque-bg bg-brand-100" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-[1]" />

                {/* Gold border on hover */}
                <div className="absolute inset-0 border border-transparent group-hover:border-soft-gold/50 transition-all duration-500 z-10" />

                {/* Featured badge */}
                {cat.featured && (
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                    <span className="bg-soft-gold text-white text-[8px] sm:text-[9px] uppercase tracking-widest px-1.5 py-0.5 sm:px-2 font-medium">
                      {t("featured")}
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-10">
                  <h2 className="font-display text-lg sm:text-2xl text-white group-hover:text-soft-gold transition-colors duration-300">
                    {displayName}
                  </h2>
                  {cat.description && (
                    <p className="text-white/60 text-[10px] sm:text-xs mt-1 line-clamp-1 sm:line-clamp-2">{cat.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-white/50 text-[10px] sm:text-xs tracking-wider">
                      {cat._count.products} {cat._count.products <= 1 ? t("piece") : t("pieces")}
                    </p>
                    <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.2em] text-white/70 group-hover:text-soft-gold transition-colors flex items-center gap-1.5">
                      {t("discover")}
                      <span className="transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform inline-block rtl:rotate-180">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Islamic values strip when empty */}
        {categories.length === 0 && (
          <div className="py-24 text-center arabesque-bg">
            <span className="text-soft-gold text-3xl block mb-4">✦</span>
            <p className="font-display text-2xl text-brand-900 mb-2">{t("emptyTitle")}</p>
            <p className="font-arabic text-soft-gold text-sm opacity-80">{t("emptySubtitle")}</p>
          </div>
        )}

        {/* Bottom ornament */}
        <div className="mt-20 text-center">
          <div className="ornament-divider max-w-sm mx-auto mb-6">
            <span className="text-soft-gold text-xs">✦</span>
          </div>
          <p className={cn("text-soft-gold text-base opacity-70", locale === "ar" ? "font-arabic text-lg" : "font-display italic")}>
            {locale === "ar" ? t("valuesArabic") : t("valuesEnglish")}
          </p>
          <p className={cn("text-brand-400 text-[10px] uppercase tracking-[0.3em] mt-1.5", locale === "ar" ? "font-display" : "font-arabic")}>
            {locale === "ar" ? t("valuesEnglish") : t("valuesArabic")}
          </p>
        </div>
      </div>
    </div>
  );
}
