import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductForm from "@/components/admin/product-form";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id }, include: { variants: true } }),
    db.category.findMany({ where: { slug: { not: "uncategorized" } }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
          <Link href="/admin/products" className="hover:text-gray-700 transition-colors">Products</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-600 truncate max-w-[200px]">{product.title}</span>
        </div>
        <h1 className="font-display text-2xl text-gray-900">Edit Product</h1>
      </div>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
