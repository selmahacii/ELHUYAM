import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import ProductDetail from "@/components/shop/product-detail";
import ProductCard from "@/components/shop/product-card";
import { getTranslations } from "next-intl/server";
import { getOptimizedImageUrl } from "@/lib/utils";
import { getProductImage } from "@/lib/cloudinary";

export const revalidate = 300;

// ── generateStaticParams ──────────────────────────────────────────────────────
// Pre-render every published product at build time so the first visitor hits
// the CDN cache (ISR) instead of a cold server render + DB query.
// dynamicParams = true (default) ensures new products added after the build
// still render on-demand and are then cached for subsequent visitors.
export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await db.product.findMany({
    where: { archived: false },
    select: { slug: true },
  });
  return products.map((p) => ({ slug: p.slug }));
}

type Props = { params: Promise<{ slug: string }> };

// React's cache() dedupes this across generateMetadata + the page component
// within a single request, so the product is only fetched once, not twice.
const getProduct = cache((slug: string) =>
  db.product.findUnique({
    where: { slug, archived: false },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      variants: true,
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.metaTitle ?? product.title,
    description: product.metaDescription ?? product.description.slice(0, 160),
    // Raw Cloudinary URLs here were the biggest bandwidth cost by far — every
    // Instagram/WhatsApp link-preview fetch downloaded the untransformed
    // original (1-2MB+) instead of a compressed, right-sized OG image.
    openGraph: {
      images: product.images[0] ? [{ url: getProductImage(product.images[0]) }] : [],
    },
  };
}

async function RelatedProducts({ categoryId, excludeId }: { categoryId: string; excludeId: string }) {
  let relatedProducts = await db.product.findMany({
    where: { categoryId, archived: false, id: { not: excludeId } },
    include: { category: { select: { id: true, name: true, slug: true } } },
    take: 4,
  });

  if (relatedProducts.length < 4) {
    const excludedIds = [excludeId, ...relatedProducts.map((p: { id: string }) => p.id)];
    const fallbackProducts = await db.product.findMany({
      where: { archived: false, id: { notIn: excludedIds } },
      include: { category: { select: { id: true, name: true, slug: true } } },
      take: 4 - relatedProducts.length,
      orderBy: { createdAt: "desc" },
    });
    relatedProducts = [...relatedProducts, ...fallbackProducts];
  }

  if (relatedProducts.length === 0) return null;

  const t = await getTranslations("product");

  return (
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
  );
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  return (
    <div>
      <ProductDetail product={product} />

      <Suspense fallback={null}>
        <RelatedProducts categoryId={product.categoryId} excludeId={product.id} />
      </Suspense>
    </div>
  );
}
