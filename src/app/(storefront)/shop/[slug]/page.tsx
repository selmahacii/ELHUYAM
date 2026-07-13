import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import { Suspense } from "react";
import type { Metadata } from "next";
import ProductDetail from "@/components/shop/product-detail";
import ProductCard from "@/components/shop/product-card";
import { getTranslations } from "next-intl/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug, archived: false },
    select: { title: true, description: true, metaTitle: true, metaDescription: true, images: true },
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.metaTitle ?? product.title,
    description: product.metaDescription ?? product.description.slice(0, 160),
    openGraph: {
      images: product.images[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("product");

  const product = await db.product.findUnique({
    where: { slug, archived: false },
    include: {
      category: true,
      variants: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) notFound();

  let relatedProducts = await db.product.findMany({
    where: { categoryId: product.categoryId, archived: false, id: { not: product.id } },
    include: { category: true },
    take: 4,
  });

  if (relatedProducts.length < 4) {
    const excludedIds = [product.id, ...relatedProducts.map((p: { id: string }) => p.id)];
    const fallbackProducts = await db.product.findMany({
      where: {
        archived: false,
        id: { notIn: excludedIds },
      },
      include: { category: true },
      take: 4 - relatedProducts.length,
      orderBy: { createdAt: "desc" },
    });
    relatedProducts = [...relatedProducts, ...fallbackProducts];
  }

  return (
    <div>
      <ProductDetail product={product} />

      {relatedProducts.length > 0 && (
        <section className="py-20 bg-brand-50 arabesque-bg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="ornament-divider max-w-xs mx-auto mb-4">
                <span className="text-soft-gold text-xs">✦</span>
              </div>
              <h2 className="font-display text-2xl md:text-3xl text-brand-900">{t("relatedProducts")}</h2>
              <p className="font-arabic text-soft-gold text-sm mt-2 opacity-80">قد يعجبك أيضاً</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p: (typeof relatedProducts)[number]) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
