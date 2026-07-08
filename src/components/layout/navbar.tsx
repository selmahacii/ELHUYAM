"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, ShoppingBag, Heart, User, ChevronRight, ChevronDown, Home, Grid3X3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import SearchModal from "@/components/shop/search-modal";
import LanguageSwitcher from "@/components/language-switcher";
import { useTranslations, useLocale } from "next-intl";
import { useRegion } from "@/providers/region-provider";

type Category = { id: string; name: string; slug: string; parentId: string | null };

const categoryTranslations: Record<string, string> = {
  // English / French names
  "abayas": "عبايات",
  "abaya": "عبايات",
  "classic abayas": "عبايات كلاسيكية",
  "butterfly abayas": "عبايات فراشة",
  "embroidered abayas": "عبايات مطرزة",
  "khimars": "خمارات",
  "khimar": "خمارات",
  "one-layer khimars": "خمارات طبقة واحدة",
  "1-layer khimars": "خمارات طبقة واحدة",
  "two-layer khimars": "خمارات طبقتين",
  "2-layer khimars": "خمارات طبقتين",
  "three-layer khimars": "خمارات ثلاث طبقات",
  "3-layer khimars": "خمارات ثلاث طبقات",
  "hijabs": "حجابات",
  "hijab": "حجابات",
  "chiffon hijabs": "حجابات شيفون",
  "jersey hijabs": "حجابات جيرسي",
  "silk hijabs": "حجابات حريرية",
  "modest sets": "أطقم محتشمة",
  "prayer sets": "أطقم صلاة",
  "casual sets": "أطقم كاجوال",
  "accessories": "إكسسوارات",
  "pins & magnets": "دبابيس ومغناطيس",
  "sleeves": "أكمام",
  "gloves": "قفازات",
  "gants": "قفازات",
  "niqab": "نقاب",
  "niqabs": "نقاب",
  
  // Singular / generic terms
  "classic abaya": "عبايات كلاسيكية",
  "butterfly abaya": "عبايات فراشة",
  "embroidered abaya": "عبايات مطرزة",
  "one-layer khimar": "خمار طبقة واحدة",
  "1-layer khimar": "خمار طبقة واحدة",
  "two-layer khimar": "خمار طبقتين",
  "2-layer khimar": "خمار طبقتين",
  "three-layer khimar": "خمار ثلاث طبقات",
  "3-layer khimar": "خمار ثلاث طبقات",
  "chiffon hijab": "حجاب شيفون",
  "jersey hijab": "حجاب جيرسي",
  "silk hijab": "حجاب حريري",
  "modest set": "طقم محتشم",
  "prayer set": "طقم صلاة",
  "casual set": "طقم كاجوال",
};

const fallbackCategories: Category[] = [
  { id: "abayas", name: "Abayas", slug: "abayas", parentId: null },
  { id: "classic-abayas", name: "Classic Abayas", slug: "classic-abayas", parentId: "abayas" },
  { id: "butterfly-abayas", name: "Butterfly Abayas", slug: "butterfly-abayas", parentId: "abayas" },
  { id: "embroidered-abayas", name: "Embroidered Abayas", slug: "embroidered-abayas", parentId: "abayas" },
  { id: "khimars", name: "Khimars", slug: "khimars", parentId: null },
  { id: "one-layer-khimars", name: "1-Layer Khimars", slug: "one-layer-khimars", parentId: "khimars" },
  { id: "two-layer-khimars", name: "2-Layer Khimars", slug: "two-layer-khimars", parentId: "khimars" },
  { id: "three-layer-khimars", name: "3-Layer Khimars", slug: "three-layer-khimars", parentId: "khimars" },
  { id: "hijabs", name: "Hijabs", slug: "hijabs", parentId: null },
  { id: "chiffon-hijabs", name: "Chiffon Hijabs", slug: "chiffon-hijabs", parentId: "hijabs" },
  { id: "jersey-hijabs", name: "Jersey Hijabs", slug: "jersey-hijabs", parentId: "hijabs" },
  { id: "silk-hijabs", name: "Silk Hijabs", slug: "silk-hijabs", parentId: "hijabs" },
  { id: "modest-sets", name: "Modest Sets", slug: "modest-sets", parentId: null },
  { id: "prayer-sets", name: "Prayer Sets", slug: "prayer-sets", parentId: "modest-sets" },
  { id: "casual-sets", name: "Casual Sets", slug: "casual-sets", parentId: "modest-sets" },
  { id: "accessories", name: "Accessories", slug: "accessories", parentId: null },
  { id: "pins-magnets", name: "Pins & Magnets", slug: "pins-magnets", parentId: "accessories" },
  { id: "sleeves", name: "Sleeves", slug: "sleeves", parentId: "accessories" },
];

export default function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { region, setRegion } = useRegion();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileCollectionsOpen, setMobileCollectionsOpen] = useState(false);
  const pathname = usePathname();
  const { items } = useCartStore();
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const translateCategoryName = (name: string) => {
    if (locale !== "ar") return name;
    const key = name.toLowerCase().trim();
    return categoryTranslations[key] ?? name;
  };

  const textClass = "text-brand-900 hover:text-black";

  const linkClass = (href: string) => {
    return pathname === href ? "text-brand-900" : "text-brand-900 hover:text-brand-400";
  };

  const navLinks = [
    { label: t("shop"), href: "/shop", hasDropdown: false, icon: Grid3X3 },
    { label: t("collections"), href: "/categories", hasDropdown: true, icon: Sparkles },
    { label: t("newArrivals"), href: "/shop?newArrival=true", hasDropdown: false, icon: Sparkles },
  ];

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((json) => { if (json.success && Array.isArray(json.data)) setCategories(json.data); })
      .catch(() => {});
  }, []);

  const categoriesList = categories.length > 0 ? categories : fallbackCategories;
  const mainCategories = categoriesList.filter((c) => !c.parentId);
  const subCategoriesMap = categoriesList.reduce((acc: Record<string, Category[]>, cat) => {
    if (cat.parentId) {
      acc[cat.parentId] = [...(acc[cat.parentId] ?? []), cat];
    }
    return acc;
  }, {});

  useEffect(() => {
    if (mainCategories.length > 0) {
      if (!hoveredCategory || !mainCategories.some((c) => c.id === hoveredCategory)) {
        setHoveredCategory(mainCategories[0].id);
      }
    }
  }, [categoriesList, hoveredCategory, mainCategories]);

  const activeMainCat = mainCategories.find((c) => c.id === hoveredCategory);
  const hoveredCategoryName = activeMainCat ? translateCategoryName(activeMainCat.name) : "";
  const hoveredCategorySlug = activeMainCat?.slug ?? "";
  const currentSubCategories = hoveredCategory ? (subCategoriesMap[hoveredCategory] ?? []) : [];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <nav className="fixed top-0 w-full z-[9999]">
        {/* Header bar */}
        <div
          className={cn(
            "transition-all duration-300 relative z-50",
            "bg-warm-white/95 backdrop-blur-md shadow-none lg:bg-transparent lg:shadow-none",
            (scrolled || mobileOpen) && "lg:bg-warm-white/95 lg:backdrop-blur-md lg:shadow-luxury"
          )}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">

              {/* Left: Desktop nav + mobile hamburger */}
              <div className="flex-1 flex items-center">
                {/* Mobile hamburger — modern pill button */}
                <button
                  className={cn(
                    "lg:hidden flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
                    mobileOpen
                      ? "bg-brand-900 text-white"
                      : "bg-black/[0.06] text-brand-900 hover:bg-black/10"
                  )}
                  onClick={() => setMobileOpen(!mobileOpen)}
                  aria-label="Toggle menu"
                >
                  <span
                    className="flex items-center justify-center transition-transform duration-300"
                    style={{ transform: mobileOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  >
                    {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                  </span>
                </button>

                {/* Desktop nav */}
                <nav className="hidden lg:flex items-center gap-6">
                  {navLinks.map((link) => (
                    <div
                      key={link.href}
                      className="relative group"
                      onMouseEnter={() => link.hasDropdown && setActiveDropdown(link.label)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] rtl:tracking-normal font-medium transition-colors underline-grow whitespace-nowrap",
                          linkClass(link.href)
                        )}
                      >
                        {link.label}
                        {link.hasDropdown && <ChevronDown className="w-3 h-3" />}
                      </Link>

                      {link.hasDropdown && activeDropdown === link.label && (
                        <div className="absolute top-full left-0 rtl:left-auto rtl:right-0 pt-3 z-50">
                          <div className="bg-warm-white border border-brand-100 shadow-luxury-lg flex min-w-[460px] overflow-hidden relative">
                            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gold-gradient opacity-60" />
                            <div className="w-[180px] border-r rtl:border-r-0 rtl:border-l border-brand-50 py-3 bg-brand-50/20">
                              {mainCategories.map((cat) => (
                                <div
                                  key={cat.id}
                                  onMouseEnter={() => setHoveredCategory(cat.id)}
                                  className={cn(
                                    "flex items-center justify-between px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] rtl:tracking-normal cursor-pointer transition-all duration-200",
                                    hoveredCategory === cat.id
                                      ? "bg-warm-white text-black font-semibold pl-5 rtl:pl-0 rtl:pr-5"
                                      : "text-brand-700 hover:bg-brand-50/40 hover:text-black"
                                  )}
                                >
                                  <Link href={`/shop?category=${cat.slug}`} className="flex-1 flex items-center gap-1.5">
                                    <span className="text-soft-gold text-[7px]">◆</span>
                                    {translateCategoryName(cat.name)}
                                  </Link>
                                  {(subCategoriesMap[cat.id]?.length ?? 0) > 0 && (
                                    <span className="text-[7px] text-brand-400 inline-block rtl:rotate-180">▶</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex-1 p-4 min-w-[260px] flex flex-col justify-between">
                              <div>
                                <p className="text-[9px] uppercase tracking-[0.25em] rtl:tracking-normal text-brand-400 mb-3 border-b border-brand-50 pb-1.5 font-medium">
                                  {hoveredCategoryName}
                                </p>
                                <div className="space-y-0.5">
                                  {currentSubCategories.length > 0 ? (
                                    currentSubCategories.map((sub) => (
                                      <Link
                                        key={sub.id}
                                        href={`/shop?category=${sub.slug}`}
                                        className="block px-2.5 py-1.5 text-[9px] uppercase tracking-[0.15em] rtl:tracking-normal text-brand-600 hover:text-black hover:bg-brand-50/30 transition-all duration-200"
                                      >
                                        {translateCategoryName(sub.name)}
                                      </Link>
                                    ))
                                  ) : (
                                    <p className="text-[9px] italic text-brand-400 py-4 text-center">
                                      {t("noSubcategories")}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {hoveredCategorySlug && (
                                <div className="mt-4 pt-2 border-t border-brand-50 flex justify-end">
                                  <Link
                                    href={`/shop?category=${hoveredCategorySlug}`}
                                    className="inline-flex items-center gap-1 text-[8px] uppercase tracking-[0.2em] rtl:tracking-normal font-semibold text-brand-900 hover:text-black transition-colors"
                                  >
                                    {t("discoverAll")} {hoveredCategoryName}
                                    <span className="text-[10px] inline-block rtl:rotate-180">→</span>
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </nav>
              </div>

              {/* Center: Logo */}
              <div className="flex-shrink-0 flex justify-center items-center">
                <Link href="/" className="group flex flex-col items-center justify-center gap-0.5">
                  {/* Desktop Logo (Text) */}
                  <span className="hidden lg:inline font-display text-2xl lg:text-3xl tracking-[0.3em] font-semibold text-black group-hover:text-black/80 transition-colors whitespace-nowrap">
                    EL HUYAM
                  </span>
                  {/* Mobile Logo — same as hero section text */}
                  <span className="lg:hidden font-display text-base uppercase tracking-[0.25em] font-medium text-black leading-none">
                    EL HUYAM
                  </span>
                 
                </Link>
              </div>

              {/* Right: icons */}
              <div className="flex-1 flex items-center justify-end gap-1 lg:gap-2">
                {mounted && (
                  <button
                    onClick={() => setRegion(region === "ALGERIA" ? "INTERNATIONAL" : "ALGERIA")}
                    className={cn(
                      "hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold transition-all duration-200 border rounded-full",
                      region === "ALGERIA"
                        ? "bg-brand-50 text-brand-900 border-brand-100 hover:bg-brand-100"
                        : "bg-black text-white border-black hover:bg-black/90"
                    )}
                    title={region === "ALGERIA" ? "Switch to International (EUR)" : "Switch to Algeria (DZD)"}
                  >
                    {region === "ALGERIA" ? "🇩🇿 DZD" : "🌍 EUR"}
                  </button>
                )}

                <LanguageSwitcher className={cn("hidden lg:flex px-1 py-2 transition-colors", textClass)} />

                <button
                  onClick={() => setSearchOpen(true)}
                  className={cn("p-2 transition-colors", textClass)}
                  aria-label={t("search")}
                >
                  <Search className="w-5 h-5" />
                </button>

                {session ? (
                  <Link
                    href={(session?.user as any)?.role === "ADMIN" ? "/admin" : "/account"}
                    className={cn("p-2 transition-colors hidden lg:block", textClass)}
                    aria-label={t("account")}
                  >
                    <User className="w-5 h-5" />
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    className={cn("p-2 transition-colors hidden lg:block", textClass)}
                    aria-label={t("login")}
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}

                <Link
                  href="/wishlist"
                  className={cn("p-2 transition-colors hidden lg:block", textClass)}
                  aria-label={t("wishlist")}
                >
                  <Heart className="w-5 h-5" />
                </Link>

                <Link
                  href="/cart"
                  className={cn("p-2 transition-colors relative", textClass)}
                  aria-label={t("cart")}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-soft-gold text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center rounded-full font-semibold px-0.5">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {scrolled && <div className="h-[1px] bg-gradient-to-r from-transparent via-soft-gold/40 to-transparent" />}

        {/* ── Mobile Bottom-Sheet backdrop ─────────────────────────────────────── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-30 lg:hidden bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            style={{ animation: "fadeIn 200ms ease both" }}
          />
        )}

        {/* ── Mobile Bottom-Sheet drawer ────────────────────────────────────────── */}
        <div
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 lg:hidden",
            "bg-warm-white rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.18)]",
            "transition-transform",
            mobileOpen ? "translate-y-0" : "translate-y-full"
          )}
          style={{ 
            maxHeight: "88svh",
            transitionDuration: "350ms",
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)"
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-brand-200" />
          </div>

          {/* Sheet header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-brand-100/60">
            <span className="text-[10px] uppercase tracking-[0.3em] text-black font-semibold">Menu</span>
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto" style={{ maxHeight: "calc(88svh - 108px)" }}>
            <div className="px-5 py-4 space-y-1">

              {/* Home */}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-150",
                  pathname === "/"
                    ? "bg-black text-white"
                    : "text-black hover:bg-black/[0.04] active:bg-black/[0.08]"
                )}
              >
                <Home className="w-4 h-4 shrink-0" />
                {tCommon("home")}
              </Link>

              {navLinks.map((link) => (
                <div key={link.href}>
                  {link.hasDropdown ? (
                    <>
                      <button
                        onClick={() => setMobileCollectionsOpen(!mobileCollectionsOpen)}
                        className={cn(
                          "flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-150",
                          mobileCollectionsOpen
                            ? "bg-black text-white"
                            : "text-black hover:bg-black/[0.04]"
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <link.icon className="w-4 h-4 shrink-0" />
                          {link.label}
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform duration-300",
                            mobileCollectionsOpen && "rotate-180"
                          )}
                        />
                      </button>

                      {mobileCollectionsOpen && (
                        <div className="mt-1 mb-2 mx-2 bg-black/[0.03] rounded-2xl overflow-hidden">
                          {mainCategories.map((cat) => (
                            <div key={cat.id}>
                              <Link
                                href={`/shop?category=${cat.slug}`}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center justify-between px-4 py-3 text-[10px] uppercase tracking-widest rtl:tracking-normal font-semibold text-black hover:bg-black/[0.05] transition-colors border-b border-brand-100/40 last:border-0"
                              >
                                <span className="flex items-center gap-2">
                                  <span className="text-soft-gold text-[8px]">◆</span>
                                  {translateCategoryName(cat.name)}
                                </span>
                                {(subCategoriesMap[cat.id]?.length ?? 0) > 0 && (
                                  <ChevronRight className="w-3 h-3 text-brand-400 rtl:rotate-180" />
                                )}
                              </Link>
                              {(subCategoriesMap[cat.id]?.length ?? 0) > 0 && (
                                <div className="pl-8 rtl:pl-0 rtl:pr-8 bg-black/[0.015]">
                                  {subCategoriesMap[cat.id].map((sub) => (
                                    <Link
                                      key={sub.id}
                                      href={`/shop?category=${sub.slug}`}
                                      onClick={() => setMobileOpen(false)}
                                      className="block py-2 pr-4 rtl:pr-0 rtl:pl-4 text-[9px] uppercase tracking-widest rtl:tracking-normal text-black/80 hover:text-black transition-colors border-b border-brand-100/30 last:border-0"
                                    >
                                      {translateCategoryName(sub.name)}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[11px] uppercase tracking-[0.15em] font-medium transition-all duration-150",
                        pathname === link.href
                          ? "bg-black text-white"
                          : "text-black hover:bg-black/[0.04] active:bg-black/[0.08]"
                      )}
                    >
                      <link.icon className="w-4 h-4 shrink-0" />
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Bottom actions */}
            <div className="px-5 pb-8 pt-3 space-y-3 border-t border-brand-100/60 mt-2">
              <LanguageSwitcher className="justify-center text-brand-700 py-3 w-full bg-brand-50 rounded-2xl" />
              {mounted && (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setRegion("ALGERIA")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 text-[9px] uppercase tracking-wider font-semibold rounded-2xl border transition-all duration-200",
                      region === "ALGERIA"
                        ? "bg-black text-white border-black"
                        : "bg-brand-50 text-brand-700 border-transparent hover:bg-brand-100"
                    )}
                  >
                    <span>🇩🇿 Algeria (DZD)</span>
                  </button>
                  <button
                    onClick={() => setRegion("INTERNATIONAL")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 text-[9px] uppercase tracking-wider font-semibold rounded-2xl border transition-all duration-200",
                      region === "INTERNATIONAL"
                        ? "bg-black text-white border-black"
                        : "bg-brand-50 text-brand-700 border-transparent hover:bg-brand-100"
                    )}
                  >
                    <span>🌍 International (EUR)</span>
                  </button>
                </div>
              )}
              {session ? (
                <Link href={(session?.user as any)?.role === "ADMIN" ? "/admin" : "/account"} className="block">
                  <Button variant="luxury" size="sm" className="w-full rounded-2xl py-3.5">
                    {(session?.user as any)?.role === "ADMIN" ? t("adminDashboard") : t("account")}
                  </Button>
                </Link>
              ) : (
                <div className="flex gap-3">
                  <Link href="/auth/login" className="flex-1">
                    <Button variant="luxury-outline" size="sm" className="w-full rounded-2xl">{t("login")}</Button>
                  </Link>
                  <Link href="/auth/register" className="flex-1">
                    <Button variant="luxury" size="sm" className="w-full rounded-2xl">{t("register")}</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
