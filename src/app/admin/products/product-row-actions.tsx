"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import StockUpdateModal from "./stock-update-modal";

interface Product {
  id: string;
  title: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  stock: number;
  variants: any[];
}

export default function ProductRowActions({ product }: { product: Product }) {
  return (
    <div className="inline-flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-0.5 shadow-2xs group-hover:border-slate-300/80 transition-all duration-200">
      <Link
        href={`/admin/products/${product.id}/edit`}
        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all duration-200 shadow-3xs"
        title="Edit"
      >
        <Edit className="w-3.5 h-3.5" />
      </Link>

      <div className="w-px h-4.5 bg-slate-200 mx-0.5 shrink-0" />

      <StockUpdateModal product={product} />
    </div>
  );
}
