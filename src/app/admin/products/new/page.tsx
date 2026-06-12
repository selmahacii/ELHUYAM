import { db } from "@/lib/db";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductForm from "@/components/admin/product-form";

export default async function NewProductPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Link href="/admin/products" className="hover:text-gray-700 transition-colors">Produits</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-600">Nouveau produit</span>
        </div>
        <h1 className="font-display text-2xl text-gray-900">Ajouter un produit</h1>
      </div>
      <ProductForm categories={categories} />
    </div>
  );
}
