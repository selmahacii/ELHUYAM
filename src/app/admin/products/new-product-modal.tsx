"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import ProductForm from "@/components/admin/product-form";

interface Category { id: string; name: string; parentId?: string | null }

export default function NewProductModal({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 text-xs uppercase tracking-widest font-medium hover:bg-gray-700 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Product
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Slide-over panel */}
          <div className="relative ml-auto w-full max-w-2xl h-full bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h2 className="font-display text-lg text-gray-900">New Product</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <ProductForm categories={categories} onSuccess={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
