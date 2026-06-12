"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import ShopFilters from "./shop-filters";

interface Category { id: string; name: string; slug: string }

export default function MobileFilters({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] border border-brand-200 px-4 py-2.5 text-brand-700 hover:border-soft-gold hover:text-soft-gold transition-all duration-200"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filtres
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[320px] max-w-full bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Gold top accent */}
        <div className="h-[2px] bg-gold-gradient opacity-60" />
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-100">
          <div>
            <span className="font-display text-lg text-brand-900">Filtres</span>
            <p className="font-arabic text-soft-gold text-xs opacity-60 leading-none">تصفية</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 text-brand-500 hover:text-brand-900 transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100%-76px)] px-6 py-6">
          <ShopFilters categories={categories} onFilterChange={() => setOpen(false)} />
        </div>
      </div>
    </>
  );
}
