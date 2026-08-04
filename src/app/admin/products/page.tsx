import { db } from "@/lib/db";
import { formatPrice, formatDate, getOptimizedImageUrl } from "@/lib/utils";
import Link from "next/link";
import { AlertTriangle, Package, Folder, TrendingUp, Sparkles, Filter, X, Search } from "lucide-react";
import ProductRowActions from "./product-row-actions";
import StockEditor from "./stock-editor";
import PriceEditModal from "./price-edit-modal";
import NewProductModal from "./new-product-modal";

interface SearchParams {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
    lowStock?: string;
  }>;
}

function VariantStockSummary({
  variants,
}: {
  variants: { id: string; stock: number; color?: string | null; size?: string | null }[];
}) {
  const total = variants.reduce((s, v) => s + v.stock, 0);
  const outOfStock = variants.filter((v) => v.stock === 0).length;
  const low = variants.filter((v) => v.stock > 0 && v.stock <= 5).length;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {(outOfStock > 0 || low > 0) && (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        )}
        <span className={`text-xs font-bold ${total === 0 ? "text-red-500 font-extrabold" : low > 0 ? "text-amber-600 font-extrabold" : "text-slate-800 font-extrabold"}`}>
          {total} in stock
        </span>
      </div>
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-bold font-mono shrink-0">
          {variants.length} var.
        </span>
        {outOfStock > 0 && (
          <span className="text-[9px] bg-rose-50 text-rose-600 px-1 py-0.2 rounded font-bold shrink-0">
            {outOfStock} out of stock
          </span>
        )}
      </div>
    </div>
  );
}

export default async function AdminProductsPage({ searchParams }: SearchParams) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  let lowStockProductIds: string[] = [];
  if (sp.lowStock === "true") {
    const rawLowStockProducts = await db.$queryRaw<any[]>`
      SELECT id FROM "Product" P
      WHERE P.archived = false AND (
        (P.stock <= P."lowStockThreshold" AND NOT EXISTS (SELECT 1 FROM "ProductVariant" V WHERE V."productId" = P.id))
        OR EXISTS (SELECT 1 FROM "ProductVariant" V WHERE V."productId" = P.id AND V.stock <= P."lowStockThreshold")
      )
    `;
    lowStockProductIds = rawLowStockProducts.map((p: any) => p.id);
  }

  const where = {
    archived: false,
    ...(sp.search
      ? {
          OR: [
            { title: { contains: sp.search } },
            { sku: { contains: sp.search } },
          ],
        }
      : {}),
    ...(sp.category ? { categoryId: sp.category } : {}),
    ...(sp.lowStock === "true"
      ? {
          id: { in: lowStockProductIds },
        }
      : {}),
  };

  const [products, total, categories, allCounts] = await Promise.all([
    db.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        variants: { select: { id: true, stock: true, color: true, size: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.product.count({ where }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    // Global metrics counters
    Promise.all([
      db.product.count({ where: { archived: false } }),
      Promise.all([
        db.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM "Product" P
          WHERE P.archived = false
          AND P.stock <= P."lowStockThreshold"
          AND NOT EXISTS (SELECT 1 FROM "ProductVariant" V WHERE V."productId" = P.id)
        `,
        db.$queryRaw<any[]>`
          SELECT COUNT(*) as count FROM "ProductVariant" V
          INNER JOIN "Product" P ON V."productId" = P.id
          WHERE P.archived = false
          AND V.stock <= P."lowStockThreshold"
        `
      ]).then(([pRaw, vRaw]) => Number(pRaw[0]?.count ?? 0) + Number(vRaw[0]?.count ?? 0)),
      db.product.count({ where: { featured: true, archived: false } }),
      db.product.count({ where: { bestseller: true, archived: false } })
    ])
  ]);

  const [globalTotalProducts, globalLowStockCount, globalFeaturedCount, globalBestsellerCount] = allCounts;
  const totalPages = Math.ceil(total / limit);

  const buildPageLink = (p: number) => {
    const params = new URLSearchParams();
    if (sp.search) params.set("search", sp.search);
    if (sp.category) params.set("category", sp.category);
    if (sp.lowStock) params.set("lowStock", sp.lowStock);
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">Product Catalog</h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            View, edit, and manage your product files, promotional prices, and variant stocks.
          </p>
        </div>
        <NewProductModal categories={categories} />
      </div>

      {/* ── Products Metrics Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Produits */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Catalog</p>
            <h3 className="text-xl font-bold text-slate-900">{globalTotalProducts}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Stock faible */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Critical Stocks (≤5)</p>
            <h3 className="text-xl font-bold text-rose-600">{globalLowStockCount}</h3>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* Vedettes */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Featured (Home)</p>
            <h3 className="text-xl font-bold text-amber-600">{globalFeaturedCount}</h3>
          </div>
          <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-600">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Bestsellers */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Active Bestsellers</p>
            <h3 className="text-xl font-bold text-brand-900">{globalBestsellerCount}</h3>
          </div>
          <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-900">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>


      {/* ── Filters Form Card ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <form method="GET" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 flex-1 items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="search"
                defaultValue={sp.search}
                placeholder="Search by title or SKU..."
                className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-slate-800 transition-all h-9 font-medium"
              />
            </div>
            
            {/* Category Dropdown */}
            <select
              name="category"
              defaultValue={sp.category}
              className="border border-gray-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:border-slate-800 transition-all h-9 font-medium min-w-[170px]"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            {/* Low stock checkbox */}
            <label className="flex items-center gap-2 text-xs text-slate-600 border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-50 transition-all h-9 bg-white shadow-2xs font-semibold">
              <input
                type="checkbox"
                name="lowStock"
                value="true"
                defaultChecked={sp.lowStock === "true"}
                className="accent-slate-900 rounded"
              />
              <span>Low Stock (≤5)</span>
            </label>
          </div>

          <div className="flex gap-2 shrink-0">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-sm transition-all h-9"
            >
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            {(sp.search || sp.category || sp.lowStock) && (
              <Link
                href="/admin/products"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-slate-600 rounded-xl transition-all h-9 bg-white shadow-sm"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* ── Table Container ── */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {["Product", "Category", "Price", "Stock", "Status", "Date Created", ""].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300">
                        <Package className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">No products found in your catalog.</p>
                    </div>
                  </td>
                </tr>
              )}
              {products.map((product: any) => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors duration-150 group">
                  {/* Product Visual Details */}
                  <td className="px-4 py-3">
                    <Link href={`/shop/${product.slug}`} target="_blank" className="flex items-center gap-3 group/product">
                      {product.images[0] ? (
                        <img 
                          src={getOptimizedImageUrl(product.images[0], 100)} 
                          alt="" 
                          className="w-10 h-13 object-cover bg-slate-150 rounded-lg shadow-2xs border border-slate-200/40 shrink-0 group-hover/product:opacity-85 transition-opacity duration-200" 
                        />
                      ) : (
                        <div className="w-10 h-13 bg-slate-50 border border-slate-200/50 rounded-lg flex items-center justify-center text-slate-400 shrink-0 shadow-2xs">
                          <Package className="w-4 h-4 opacity-50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 group-hover/product:text-brand-900 group-hover/product:underline decoration-1 underline-offset-2 transition-colors">
                          {product.title}
                        </p>
                        {product.sku ? (
                          <span className="inline-block mt-0.5 font-mono text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.2 rounded">
                            {product.sku}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-300 italic font-medium mt-0.5 block">No SKU</span>
                        )}
                      </div>
                    </Link>
                  </td>

                  {/* Category Link */}
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 border border-slate-200/60 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                      {product.category?.name ?? "Uncategorized"}
                    </span>
                  </td>

                  {/* Pricing interactive */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 group/price">
                      <div>
                        <p className="font-bold text-slate-900 text-xs sm:text-sm">
                          {formatPrice(product.discountPrice ?? product.price)}
                        </p>
                        {product.discountPrice && (
                          <p className="text-[10px] text-slate-400 line-through font-semibold font-mono">
                            {formatPrice(product.price)}
                          </p>
                        )}
                      </div>
                      <PriceEditModal
                        productId={product.id}
                        title={product.title}
                        price={product.price}
                        discountPrice={product.discountPrice ?? null}
                        priceEur={product.priceEur}
                        discountPriceEur={product.discountPriceEur ?? null}
                      />
                    </div>
                  </td>

                  {/* Stocks quantity or variant tree */}
                  <td className="px-4 py-3">
                    {product.variants.length > 0 ? (
                      <VariantStockSummary variants={product.variants} />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {product.stock <= 5 && product.stock > 0 && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        )}
                        <StockEditor productId={product.id} initialStock={product.stock} />
                      </div>
                    )}
                  </td>

                  {/* Visual Promotion Status Badges */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.featured && (
                        <span className="px-2 py-0.5 text-[9.5px] uppercase tracking-wider font-extrabold bg-amber-50 text-amber-700 border border-amber-100 rounded-lg shadow-2xs">
                          Featured
                        </span>
                      )}
                      {product.bestseller && (
                        <span className="px-2 py-0.5 text-[9.5px] uppercase tracking-wider font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg shadow-2xs">
                          Bestseller
                        </span>
                      )}
                      {product.newArrival && (
                        <span className="px-2 py-0.5 text-[9.5px] uppercase tracking-wider font-extrabold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg shadow-2xs">
                          New
                        </span>
                      )}
                      {!product.featured && !product.bestseller && !product.newArrival && (
                        <span className="px-2 py-0.5 text-[9.5px] uppercase tracking-wider font-extrabold bg-slate-50 text-slate-500 border border-slate-100 rounded-lg shadow-2xs">
                          Active
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Creation date */}
                  <td className="px-4 py-3 text-slate-500 font-semibold text-xs whitespace-nowrap">
                    {formatDate(product.createdAt)}
                  </td>

                  {/* Actions column */}
                  <td className="px-4 py-3 text-right">
                    <ProductRowActions
                      product={{
                        id: product.id,
                        title: product.title,
                        featured: product.featured,
                        bestseller: product.bestseller,
                        newArrival: product.newArrival,
                        stock: product.stock,
                        variants: product.variants,
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination navigation */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{skip + 1}</span> to <span className="font-bold text-slate-900">{Math.min(skip + limit, total)}</span> of <span className="font-bold text-slate-900">{total}</span> products
            </p>
            <div className="flex items-center gap-1">
              {page > 1 && (
                <Link 
                  href={buildPageLink(page - 1)} 
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-white text-slate-600 flex items-center justify-center transition-all bg-slate-50 shadow-sm"
                >
                  ‹
                </Link>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="w-8 h-8 flex items-center justify-center text-slate-300 text-xs">…</span>
                    )}
                    <Link
                      href={buildPageLink(p)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        p === page 
                          ? "bg-slate-900 text-white border border-slate-900" 
                          : "border border-gray-200 hover:bg-white text-slate-600 bg-slate-50/50"
                      }`}
                    >
                      {p}
                    </Link>
                  </span>
                ))}
              {page < totalPages && (
                <Link 
                  href={buildPageLink(page + 1)} 
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-white text-slate-600 flex items-center justify-center transition-all bg-slate-50 shadow-sm"
                >
                  ›
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
