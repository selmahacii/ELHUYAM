"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getThumbnail } from "@/lib/cloudinary";

type CategoryItem = {
  name: string;
  slug: string;
  image: string | null;
};

interface CategoryCarouselProps {
  categories: CategoryItem[];
  discoverText: string;
}

export default function CategoryCarousel({ categories, discoverText }: CategoryCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const arabicWords = ["الحشمة", "الجمال", "الأناقة", "الهوية"];

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340; // width of card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="relative group/carousel">
      {/* Navigation Left Arrow (Desktop only) */}
      <button
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white border border-brand-100 hover:bg-brand-900 hover:text-white transition-all text-brand-900 shadow-luxury hover:scale-105 active:scale-95"
      >
        <ChevronLeft className="w-5 h-5 text-soft-gold" />
      </button>

      {/* Navigation Right Arrow (Desktop only) */}
      <button
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 items-center justify-center bg-white border border-brand-100 hover:bg-brand-900 hover:text-white transition-all text-brand-900 shadow-luxury hover:scale-105 active:scale-95"
      >
        <ChevronRight className="w-5 h-5 text-soft-gold" />
      </button>

      {/* Category List Container */}
      <div
        ref={scrollContainerRef}
        className="grid grid-cols-3 md:flex md:overflow-x-auto md:gap-6 md:pb-2 gap-2 sm:gap-4 md:scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((cat, i) => (
          <Link
            key={cat.slug}
            href={`/shop?category=${cat.slug}`}
            className="group relative aspect-[3/4] overflow-hidden bg-brand-50 w-full md:w-[280px] lg:w-[320px] md:shrink-0"
          >
            {cat.image ? (
              <Image
                src={getThumbnail(cat.image)}
                alt={cat.name}
                fill
                loading="lazy"
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
                sizes="(max-width: 640px) 33vw, (max-width: 1024px) 250px, 320px"
              />
            ) : (
              <div className="absolute inset-0 bg-brand-100" />
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500" />

            <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none group-hover:opacity-[0.08] transition-opacity">
              <span className="text-5xl sm:text-7xl md:text-9xl font-display" dir="rtl">
                {arabicWords[i % arabicWords.length]}
              </span>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-end p-2 sm:p-4 md:p-8 text-center translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <h3 className="font-display text-xs sm:text-base md:text-2xl text-white mb-2 md:mb-4">
                {cat.name}
              </h3>
              <div className="w-0 group-hover:w-12 h-px bg-white transition-all duration-500 mb-3 md:mb-6" />
              <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-white opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                {discoverText}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
