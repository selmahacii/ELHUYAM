"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { slugify, cn } from "@/lib/utils";
import { getThumbnail } from "@/lib/cloudinary";
import { toast } from "react-hot-toast";
import { Plus, X, Trash2, ImagePlus, Loader2, AlertTriangle, PackageX, TrendingDown, CheckCircle2, Eye } from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Category { id: string; name: string; parentId?: string | null }
interface Variant {
  id?: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  image?: string | null;
  stock: number;
  price?: number | null;
  costPrice?: number | null;
  priceEur?: number | null;
}
interface ProductData {
  id: string; title: string; slug: string; description: string;
  price: number; discountPrice?: number | null; priceEur: number; discountPriceEur?: number | null; costPrice?: number | null;
  stock: number; sku?: string | null; lowStockThreshold?: number;
  categoryId: string; images: string[]; videos: string[]; tags: string[];
  featured: boolean; bestseller: boolean; newArrival: boolean;
  metaTitle?: string | null; metaDescription?: string | null;
  variants: Variant[];
}

interface ProductFormProps {
  categories: Category[];
  product?: ProductData;
  onSuccess?: () => void;
}

const inputCls = "w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-700 transition-colors bg-white";
const labelCls = "block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-medium";
const sectionCls = "bg-white border border-gray-200 p-6 space-y-4";
const headingCls = "font-display text-base text-gray-900 border-b border-gray-100 pb-3";

const LOW_STOCK_THRESHOLD = 10;

const LUXURY_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "Off-White", hex: "#FAF9F6" },
  { name: "Beige", hex: "#D4C3B3" },
  { name: "Sand / Camel", hex: "#C19A6B" },
  { name: "Chocolate Brown", hex: "#3D2314" },
  { name: "Bordeaux", hex: "#5C061B" },
  { name: "Midnight Blue", hex: "#1A2530" },
  { name: "Olive Green", hex: "#556B2F" },
  { name: "Emerald Green", hex: "#0F2E23" },
  { name: "Powder Rose", hex: "#E8C8C8" },
  { name: "Charcoal Grey", hex: "#4A4A4A" },
];

export default function ProductForm({ categories, product, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const isEdit = !!product;

  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? []);
  
  // Bulk variant creation states
  const [bulkColor, setBulkColor] = useState("");
  const [bulkColorHex, setBulkColorHex] = useState("#000000");
  const [bulkColorImage, setBulkColorImage] = useState<string | null>(null);
  const [bulkSizesInput, setBulkSizesInput] = useState("");
  const [bulkStock, setBulkStock] = useState(0);
  const [bulkPrice, setBulkPrice] = useState<number | null>(null);
  const [bulkPriceEur, setBulkPriceEur] = useState<number | null>(null);
  const [bulkCostPrice, setBulkCostPrice] = useState<number | null>(null);
  const [showPresetsDropdown, setShowPresetsDropdown] = useState(false);
  const [sameStockForAll, setSameStockForAll] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [variantImgUploading, setVariantImgUploading] = useState(false);
  const variantImgRef = useRef<HTMLInputElement>(null);

  const initialProductCategory = categories.find((c) => c.id === product?.categoryId);
  const initialParentId = initialProductCategory?.parentId
    ? initialProductCategory.parentId
    : initialProductCategory?.id ?? "";

  const [selectedParentId, setSelectedParentId] = useState(initialParentId);
  const [selectedSubId, setSelectedSubId] = useState(
    initialProductCategory?.parentId ? product?.categoryId ?? "" : ""
  );

  const availableSubCategories = categories.filter((c) => c.parentId === selectedParentId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title ?? "",
      slug: product?.slug ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      discountPrice: product?.discountPrice ?? undefined,
      priceEur: product?.priceEur ?? 0,
      discountPriceEur: product?.discountPriceEur ?? undefined,
      costPrice: product?.costPrice ?? undefined,
      stock: product?.stock ?? 0,
      sku: product?.sku ?? "",
      categoryId: product?.categoryId ?? "",
      images: product?.images ?? [],
      videos: [],
      tags: product?.tags ?? [],
      featured: product?.featured ?? false,
      bestseller: product?.bestseller ?? false,
      newArrival: product?.newArrival ?? false,
      metaTitle: product?.metaTitle ?? "",
      metaDescription: product?.metaDescription ?? "",
      lowStockThreshold: product?.lowStockThreshold ?? 5,
    },
  });

  const title = watch("title");
  const priceWatch = watch("price");
  const discountPriceWatch = watch("discountPrice");
  const costPriceWatch = watch("costPrice");
  const lowStockThresholdWatch = watch("lowStockThreshold");
  const threshold = isNaN(Number(lowStockThresholdWatch)) ? 5 : Number(lowStockThresholdWatch ?? 5);

  // Auto-calculate total stock from variants
  const hasVariants = variants.length > 0;
  const totalVariantStock = variants.reduce((s, v) => s + (v.stock ?? 0), 0);
  const outOfStockVariants = variants.filter((v) => v.stock === 0);
  const lowStockVariants = variants.filter((v) => v.stock > 0 && v.stock <= threshold);

  // Sync global stock field whenever variant stocks change
  useEffect(() => {
    if (hasVariants) {
      setValue("stock", totalVariantStock, { shouldValidate: false });
    }
  }, [totalVariantStock, hasVariants, setValue]);

  function autoSlug() {
    if (title && !isEdit) setValue("slug", slugify(title));
  }

  function addImage(url: string) {
    const updated = [...images, url];
    setImages(updated);
    setValue("images", updated);
  }

  function removeImage(url: string) {
    const updated = images.filter((i) => i !== url);
    setImages(updated);
    setValue("images", updated);
  }

  function updateVariantStock(index: number, stock: number) {
    setVariants((prev) => {
      if (sameStockForAll) {
        return prev.map((v) => ({ ...v, stock }));
      } else {
        return prev.map((v, i) => i === index ? { ...v, stock } : v);
      }
    });
  }

  const handleColorChange = (value: string) => {
    setBulkColor(value);
    const search = value.toLowerCase().trim();
    const match = LUXURY_COLORS.find(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        search.includes(c.name.toLowerCase())
    );
    if (match) {
      setBulkColorHex(match.hex);
    }
  };

  function addVariant() {
    if (!bulkColor && !bulkSizesInput.trim()) {
      toast.error("Specify at least one color or size.");
      return;
    }

    const parsedSizes = bulkSizesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const generated: Variant[] = [];
    if (parsedSizes.length > 0) {
      parsedSizes.forEach((size) => {
        const exists = variants.some(
          (v) => v.color === (bulkColor.trim() || null) && v.size === size
        );
        if (!exists) {
          generated.push({
            color: bulkColor.trim() || null,
            colorHex: bulkColor.trim() ? bulkColorHex : null,
            image: bulkColorImage,
            size: size,
            stock: bulkStock,
            price: bulkPrice,
            priceEur: bulkPriceEur,
            costPrice: bulkCostPrice,
          });
        }
      });
    } else {
      // Color-only variant
      const exists = variants.some((v) => v.color === bulkColor.trim() && !v.size);
      if (!exists) {
        generated.push({
          color: bulkColor.trim(),
          colorHex: bulkColorHex,
          image: bulkColorImage,
          size: null,
          stock: bulkStock,
          price: bulkPrice,
          priceEur: bulkPriceEur,
          costPrice: bulkCostPrice,
        });
      }
    }

    if (generated.length > 0) {
      let finalGenerated = generated;
      if (sameStockForAll && variants.length > 0) {
        const firstStock = variants[0].stock;
        finalGenerated = generated.map((g) => ({ ...g, stock: firstStock }));
      }
      setVariants([...variants, ...finalGenerated]);
      toast.success(`${generated.length} variant(s) added for color ${bulkColor || "standard"}`);
      
      // Reset input fields
      setBulkSizesInput("");
      setBulkStock(0);
      setBulkPrice(null);
      setBulkPriceEur(null);
      setBulkCostPrice(null);
      setBulkColor("");
      setBulkColorHex("#000000");
      setBulkColorImage(null);
    } else {
      toast.error("All specified combinations already exist.");
    }
  }

  async function uploadVariantImage(file: File) {
    setVariantImgUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", "el-huyaam/variants");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Upload error");
      setBulkColorImage(data.data.url);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload error");
    } finally {
      setVariantImgUploading(false);
      if (variantImgRef.current) variantImgRef.current.value = "";
    }
  }

  async function onSubmit(data: ProductInput) {
    setSaving(true);
    try {
      if (hasVariants) {
        const invalidVariant = variants.some(
          (v) => v.stock === undefined || v.stock === null || isNaN(v.stock)
        );
        if (invalidVariant) {
          toast.error("Stock quantity for each variant is required.");
          setSaving(false);
          return;
        }
      }

      const payload = {
        ...data,
        images,
        slug: data.slug || slugify(data.title),
        // If variants exist, override stock with computed total
        stock: hasVariants ? totalVariantStock : data.stock,
      };

      const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (!result.success) {
        toast.error(result.error ?? "Error during saving");
        return;
      }

      const productId = result.data.id;

      if (variants.length > 0) {
        const variantRes = await fetch(`/api/products/${productId}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variants),
        });
        if (!variantRes.ok) {
          toast.error("Product saved but variants could not be recorded.");
          router.refresh();
          return;
        }
      }

      toast.success(isEdit ? "Product updated" : "Product created");
      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/products");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${product!.id}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error ?? "Failed to delete");
      toast.success(result.message || "Product successfully deleted");
      setShowDeleteModal(false);
      router.refresh();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/admin/products");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "An error occurred");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <section className={sectionCls}>
        <h2 className={headingCls}>General Information</h2>

        <div>
          <label className={labelCls}>Product Title</label>
          <input {...register("title")} onBlur={autoSlug} className={inputCls} placeholder="e.g., Embroidered Black Abaya" />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
        </div>

        <div>
          <label className={labelCls}>Slug (URL)</label>
          <input {...register("slug")} className={inputCls} placeholder="automatically generated from title" />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea
            {...register("description")}
            rows={5}
            className={`${inputCls} resize-y`}
            placeholder="Describe the product in detail..."
          />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Main Category</label>
            <select
              value={selectedParentId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedParentId(val);
                setSelectedSubId("");
                setValue("categoryId", val, { shouldValidate: true });
              }}
              className={inputCls}
            >
              <option value="">Choose a category</option>
              {categories.filter((c) => !c.parentId).map((parent) => (
                <option key={parent.id} value={parent.id}>{parent.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Sub-category (Optional)</label>
            <select
              value={selectedSubId}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedSubId(val);
                setValue("categoryId", val || selectedParentId, { shouldValidate: true });
              }}
              disabled={!selectedParentId || availableSubCategories.length === 0}
              className={inputCls}
            >
              <option value="">No sub-category</option>
              {availableSubCategories.map((child) => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Promotion Badges */}
        <div className="border-t border-gray-100 pt-4">
          <label className={labelCls}>Badges & Visibility</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <label className="flex items-center gap-2.5 text-xs text-gray-700 border border-gray-200 p-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors bg-white select-none rounded-lg shadow-2xs">
              <input
                type="checkbox"
                {...register("featured")}
                className="accent-black rounded w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="font-bold block text-gray-900">Featured</span>
                <span className="text-[10px] text-gray-400 font-medium">Display on home page slider</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-gray-700 border border-gray-200 p-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors bg-white select-none rounded-lg shadow-2xs">
              <input
                type="checkbox"
                {...register("bestseller")}
                className="accent-black rounded w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="font-bold block text-gray-900">Bestseller</span>
                <span className="text-[10px] text-gray-400 font-medium">Trending product tag</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-gray-700 border border-gray-200 p-3.5 cursor-pointer hover:bg-slate-50/50 transition-colors bg-white select-none rounded-lg shadow-2xs">
              <input
                type="checkbox"
                {...register("newArrival")}
                className="accent-black rounded w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="font-bold block text-gray-900">New Arrival</span>
                <span className="text-[10px] text-gray-400 font-medium">Show in new collections</span>
              </div>
            </label>
          </div>
        </div>
      </section>

      {/* Pricing & Stock */}
      <section className={sectionCls}>
        <h2 className={headingCls}>Price & Inventory</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
          <div>
            <label className={labelCls}>Price (DZD)</label>
            <input type="number" step="1" min="0" {...register("price")} className={inputCls} />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Discounted price (DZD)</label>
            <input type="number" step="1" min="0" {...register("discountPrice")} className={inputCls} placeholder="Empty = no promotion" />
          </div>
          <div>
            <label className={labelCls}>Price (EUR)</label>
            <input type="number" step="0.01" min="0" {...register("priceEur")} className={inputCls} />
            {errors.priceEur && <p className="mt-1 text-xs text-red-500">{errors.priceEur.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Discounted price (EUR)</label>
            <input type="number" step="0.01" min="0" {...register("discountPriceEur")} className={inputCls} placeholder="Empty = no promotion" />
            {errors.discountPriceEur && <p className="mt-1 text-xs text-red-500">{errors.discountPriceEur.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Cost price (DZD)</label>
            <input type="number" step="1" min="0" {...register("costPrice")} className={inputCls} placeholder="e.g. Purchase price" />
            {errors.costPrice && <p className="mt-1 text-xs text-red-500">{errors.costPrice.message}</p>}
          </div>
          <div>
            <label className={labelCls}>
              Global stock
              {hasVariants && <span className="ml-1 text-[10px] text-amber-600 normal-case tracking-normal font-normal">(computed from variants)</span>}
            </label>
            {hasVariants ? (
              <div className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-500 flex items-center gap-2`}>
                <span className="font-mono font-semibold text-gray-800">{totalVariantStock}</span>
                <span className="text-gray-400 text-xs">units in total</span>
              </div>
            ) : (
              <input type="number" min="0" {...register("stock")} className={inputCls} />
            )}
            {errors.stock && <p className="mt-1 text-xs text-red-500">{errors.stock.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Alert threshold</label>
            <input type="number" min="0" {...register("lowStockThreshold")} className={inputCls} placeholder="Default = 5" />
            {errors.lowStockThreshold && <p className="mt-1 text-xs text-red-500">{errors.lowStockThreshold.message}</p>}
          </div>
        </div>

        {/* Profit Margin Indicator */}
        {(() => {
          const price = Number(discountPriceWatch || priceWatch || 0);
          const cost = Number(costPriceWatch || 0);
          if (price > 0 && cost > 0) {
            const profit = price - cost;
            const marginPercentage = (profit / price) * 100;
            const isLoss = profit < 0;
            return (
              <div className={cn(
                "p-3.5 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-sm text-xs transition-all",
                isLoss 
                  ? "bg-red-50/70 border-red-200 text-red-800" 
                  : "bg-emerald-50/70 border-emerald-200 text-emerald-800"
              )}>
                <div className="flex items-center gap-2">
                  <TrendingDown className={cn("w-4 h-4 shrink-0", isLoss ? "text-red-500" : "text-emerald-600 rotate-180")} />
                  <div>
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Profit Margin Calculator</span>
                    <p className="text-gray-500 text-[10px] mt-0.5">Calculated using the active selling price of {price.toLocaleString()} DZD</p>
                  </div>
                </div>
                <div className="flex gap-4 font-mono">
                  <div>
                    <span className="text-gray-400 uppercase tracking-widest text-[9px] block">Profit</span>
                    <strong className="text-sm font-semibold">{profit >= 0 ? "+" : ""}{profit.toLocaleString()} DZD</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 uppercase tracking-widest text-[9px] block">Margin</span>
                    <strong className="text-sm font-semibold">{marginPercentage.toFixed(1)}%</strong>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* SKU */}
        <div>
          <label className={labelCls}>SKU</label>
          <div className="flex gap-2">
            <input {...register("sku")} className={inputCls} placeholder="e.g., ELH-ABY-001" />
            <button
              type="button"
              onClick={() => {
                const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                setValue("sku", `ELH-${randomId}`, { shouldValidate: true });
              }}
              className="shrink-0 px-3 py-2 border border-gray-200 bg-gray-50 text-xs uppercase tracking-widest text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>

        {/* Stock alert banner — shown only when variants present */}
        {hasVariants && (
          <StockAlertBanner
            total={totalVariantStock}
            outOfStock={outOfStockVariants.length}
            lowStock={lowStockVariants.length}
            threshold={threshold}
          />
        )}
      </section>

      {/* Images */}
      <section className={sectionCls}>
        <h2 className={headingCls}>Product Photos</h2>
        <ImageUpload
          value={images}
          onChange={addImage}
          onRemove={removeImage}
          maxFiles={6}
        />
        {errors.images && (
          <p className="text-xs text-red-500">{errors.images.message as string}</p>
        )}
      </section>

      {/* Variants */}
      <section className={sectionCls}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
          <div>
            <h2 className="font-display text-base text-gray-900">Variants — Sizes & Colors</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {hasVariants
                ? `${variants.length} variant${variants.length > 1 ? "s" : ""} · total stock: ${totalVariantStock} units`
                : "Each variant can have its own size, color, stock, and photo."}
            </p>
          </div>
          {hasVariants && (
            <div className="flex items-center gap-3 text-xs shrink-0">
              {outOfStockVariants.length > 0 && (
                <span className="flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded">
                  <PackageX className="w-3 h-3" />
                  {outOfStockVariants.length} out of stock
                </span>
              )}
              {lowStockVariants.length > 0 && (
                <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded">
                  <TrendingDown className="w-3 h-3" />
                  {lowStockVariants.length} low stock
                </span>
              )}
            </div>
          )}
        </div>

        {/* Existing variants */}
        {variants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-250 p-2.5 rounded-sm">
              <input
                type="checkbox"
                id="sameStockForAll"
                checked={sameStockForAll}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSameStockForAll(checked);
                  if (checked && variants.length > 0) {
                    const firstStock = variants[0].stock;
                    setVariants((prev) => prev.map((v) => ({ ...v, stock: firstStock })));
                  }
                }}
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black accent-black cursor-pointer"
              />
              <label htmlFor="sameStockForAll" className="text-xs text-gray-700 font-medium select-none cursor-pointer">
                All variants share the same stock quantity
              </label>
            </div>

            <div className="border border-gray-100 divide-y divide-gray-100 bg-white">
              {variants.map((v, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                {v.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={getThumbnail(v.image)} alt="" className="w-10 h-12 object-cover bg-gray-100 shrink-0 border border-gray-200" />
                ) : (
                  <div className="w-10 h-12 bg-gray-100 shrink-0 flex items-center justify-center">
                    <ImagePlus className="w-4 h-4 text-gray-300" />
                  </div>
                )}

                {v.colorHex && (
                  <span
                    className="w-5 h-5 rounded-full border border-gray-300 shrink-0"
                    style={{ backgroundColor: v.colorHex }}
                    title={v.color ?? ""}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 font-medium">
                    {[v.size, v.color].filter(Boolean).join(" / ") || "—"}
                  </p>
                </div>

                {/* Inline price editor */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Price (DZD)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Base Price"
                    value={v.price ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Math.max(0, parseFloat(e.target.value)) : null;
                      setVariants((prev) => prev.map((item, idx) => idx === i ? { ...item, price: val } : item));
                    }}
                    className="w-20 border text-center text-xs py-1 px-2 focus:outline-none transition-colors border-gray-200 bg-white text-gray-800 focus:border-gray-600"
                  />
                </div>

                {/* Inline price EUR editor */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Price (EUR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price EUR"
                    value={v.priceEur ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Math.max(0, parseFloat(e.target.value)) : null;
                      setVariants((prev) => prev.map((item, idx) => idx === i ? { ...item, priceEur: val } : item));
                    }}
                    className="w-20 border text-center text-xs py-1 px-2 focus:outline-none transition-colors border-gray-200 bg-white text-gray-800 focus:border-gray-600"
                  />
                </div>

                {/* Inline cost price editor */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Cost</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Base Cost"
                    value={v.costPrice ?? ""}
                    onChange={(e) => {
                      const val = e.target.value ? Math.max(0, parseFloat(e.target.value)) : null;
                      setVariants((prev) => prev.map((item, idx) => idx === i ? { ...item, costPrice: val } : item));
                    }}
                    className="w-20 border text-center text-xs py-1 px-2 focus:outline-none transition-colors border-gray-200 bg-white text-gray-800 focus:border-gray-600"
                  />
                </div>

                {/* Variant Margin calculation */}
                {(() => {
                  const variantSellingPrice = Number(v.price || discountPriceWatch || priceWatch || 0);
                  const variantCostPrice = Number(v.costPrice || costPriceWatch || 0);
                  if (variantSellingPrice > 0 && variantCostPrice > 0) {
                    const variantProfit = variantSellingPrice - variantCostPrice;
                    const variantMargin = (variantProfit / variantSellingPrice) * 100;
                    return (
                      <div className="text-right shrink-0 min-w-[70px]">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 font-medium rounded-full",
                          variantProfit < 0 ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                        )}>
                          {variantMargin.toFixed(0)}% margin
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Inline stock editor */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest">Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => updateVariantStock(i, Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-16 border text-center text-sm py-1 px-2 focus:outline-none transition-colors ${
                      v.stock === 0
                        ? "border-red-300 bg-red-50 text-red-700 focus:border-red-500"
                        : v.stock <= threshold
                        ? "border-amber-300 bg-amber-50 text-amber-800 focus:border-amber-500"
                        : "border-gray-200 bg-white text-gray-800 focus:border-gray-600"
                    }`}
                  />
                </div>

                {/* Status badge */}
                {v.stock === 0 ? (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-sm shrink-0 font-medium">Out of Stock</span>
                ) : v.stock <= threshold ? (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-sm shrink-0">
                    Low
                  </span>
                ) : (
                  <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-sm shrink-0">OK</span>
                )}

                <button
                  type="button"
                  onClick={() => setVariants(variants.filter((_, idx) => idx !== i))}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

              {/* Variant stock total row */}
              <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-gray-50">
                <span className="text-xs text-gray-500 uppercase tracking-widest">Total calculated stock</span>
                <span className={`font-mono font-bold text-sm px-3 py-0.5 rounded ${
                  totalVariantStock === 0 ? "bg-red-100 text-red-700" :
                  totalVariantStock <= threshold ? "bg-amber-100 text-amber-800" :
                  "bg-green-100 text-green-700"
                }`}>
                  {totalVariantStock}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add new variant */}
        <div className="border border-dashed border-gray-300 p-5 space-y-4 bg-gray-50/50">
          <div className="border-b border-gray-200 pb-2.5">
            <p className="text-xs text-gray-700 uppercase tracking-widest font-semibold">Quick variant generator by color</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Enter or choose a color, then list all available sizes separated by commas to generate all combinations in one click.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Colonne 1 : La Couleur et son style */}
            <div className="space-y-4 bg-white p-4 border border-gray-100 shadow-sm rounded-sm">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-50 pb-1">Step 1: Color Info</p>
              
              <div className="relative">
                <label className={labelCls}>Modest Fashion Palettes (Quick Selection) *</label>
                
                {/* Custom dropdown select button with color ball (en boule) */}
                <button
                  type="button"
                  onClick={() => setShowPresetsDropdown(!showPresetsDropdown)}
                  className={`${inputCls} flex items-center justify-between text-left font-medium relative hover:border-gray-400 bg-white`}
                >
                  <span className="flex items-center gap-2">
                    {bulkColor && LUXURY_COLORS.some(c => c.name === bulkColor) ? (
                      <>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-zinc-300 shrink-0 shadow-sm animate-pulse"
                          style={{ backgroundColor: bulkColorHex }}
                        />
                        <span>{bulkColor}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">--- Choose a standard color ---</span>
                    )}
                  </span>
                  <span className="text-gray-400 text-xs transition-transform duration-200">
                    {showPresetsDropdown ? "▲" : "▼"}
                  </span>
                </button>

                {/* Custom dropdown list with color balls (en boule) */}
                {showPresetsDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40 bg-transparent"
                      onClick={() => setShowPresetsDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 shadow-xl rounded-sm z-50 max-h-60 overflow-y-auto divide-y divide-gray-50">
                      {LUXURY_COLORS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            setBulkColor(preset.name);
                            setBulkColorHex(preset.hex);
                            setShowPresetsDropdown(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors",
                            bulkColor.toLowerCase().trim() === preset.name.toLowerCase().trim()
                              ? "bg-gray-50 font-semibold"
                              : ""
                          )}
                        >
                          {/* Round color ball (en boule) */}
                          <span
                            className="w-4 h-4 rounded-full border border-zinc-300 shrink-0 shadow-sm"
                            style={{ backgroundColor: preset.hex }}
                          />
                          <span className="flex-1 text-gray-800 font-medium">{preset.name}</span>
                          <span className="text-[10px] font-mono text-gray-400">{preset.hex}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className={labelCls}>Color Name *</label>
                <input
                  value={bulkColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="e.g., Black, Beige, Plum..."
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Visual color code</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={bulkColorHex}
                      onChange={(e) => setBulkColorHex(e.target.value)}
                      className="w-10 h-10 border border-gray-200 cursor-pointer p-0.5 bg-white rounded-full"
                    />
                    <span className="text-xs text-gray-500 font-mono">{bulkColorHex}</span>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Photo for this color (optional)</label>
                  <input
                    ref={variantImgRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadVariantImage(file);
                    }}
                  />
                  {bulkColorImage ? (
                    <div className="flex items-center gap-2 bg-white p-1 border border-gray-200 w-fit">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getThumbnail(bulkColorImage)} alt="" className="w-10 h-12 object-cover" />
                      <button
                        type="button"
                        onClick={() => setBulkColorImage(null)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => variantImgRef.current?.click()}
                      disabled={variantImgUploading}
                      className="flex items-center gap-2 border border-gray-200 px-3 py-2.5 text-xs text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors bg-white disabled:opacity-50 w-full justify-center"
                    >
                      {variantImgUploading ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading...</>
                      ) : (
                        <><ImagePlus className="w-3.5 h-3.5" /> Choose a photo</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne 2 : Tailles, Stock et Prix */}
            <div className="space-y-4 bg-white p-4 border border-gray-100 shadow-sm rounded-sm">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-50 pb-1">Step 2: Sizes, Stock & Price</p>

              <div>
                <label className={labelCls}>Available sizes * (Separated by commas)</label>
                <input
                  value={bulkSizesInput}
                  onChange={(e) => setBulkSizesInput(e.target.value)}
                  placeholder="e.g., S, M, L, XL or 38, 40, 42"
                  className={inputCls}
                />
                <span className="text-[10px] text-gray-400 mt-1 block">The system will generate one row per size for this color.</span>
              </div>

              <div>
                <label className={labelCls}>Stock (for each size) *</label>
                <input
                  type="number"
                  min="0"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(Math.max(0, Number(e.target.value) || 0))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Variant price (DZD)</label>
                <input
                  type="number"
                  min="0"
                  value={bulkPrice ?? ""}
                  onChange={(e) => setBulkPrice(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Optional (uses base product price if empty)"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Variant price (EUR)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkPriceEur ?? ""}
                  onChange={(e) => setBulkPriceEur(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Optional (uses base EUR price if empty)"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Variant cost price (DZD)</label>
                <input
                  type="number"
                  min="0"
                  value={bulkCostPrice ?? ""}
                  onChange={(e) => setBulkCostPrice(e.target.value ? Number(e.target.value) : null)}
                  placeholder="Optional (uses base cost price if empty)"
                  className={inputCls}
                />
              </div>
            </div>

          </div>

          <button
            type="button"
            onClick={addVariant}
            className="w-full flex items-center justify-center gap-2 bg-black text-white py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors font-medium rounded-sm border border-black shadow"
          >
            <Plus className="w-4 h-4" /> Generate variants for this color
          </button>
        </div>
      </section>

      {/* Submit */}
      <div className="flex flex-wrap items-center gap-3 pb-4">
        <Button type="submit" variant="luxury" size="lg" loading={saving} className="min-w-[160px]">
          {isEdit ? "Save Changes" : "Create Product"}
        </Button>
        {isEdit && product?.slug && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => window.open(`/shop/${product.slug}`, "_blank")}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> Preview on Storefront
          </Button>
        )}
        <Button type="button" variant="outline" size="lg" onClick={() => onSuccess ? onSuccess() : router.back()}>
          Cancel
        </Button>
        {isEdit && (
          <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
            <DialogTrigger asChild>
              <Button type="button" variant="destructive" size="lg" className="ml-auto">
                Delete Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete this product?</DialogTitle>
                <DialogDescription>
                  This action is irreversible. The product and all its variants will be deleted. If it is linked to existing orders, it will be automatically archived to preserve your accounting history.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-4">
                <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteProduct} loading={deleting}>
                  Yes, delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </form>
  );
}

function StockAlertBanner({
  total, outOfStock, lowStock, threshold,
}: {
  total: number; outOfStock: number; lowStock: number; threshold: number;
}) {
  if (total === 0) {
    return (
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded">
        <PackageX className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">Product out of stock</p>
          <p className="text-xs text-red-500 mt-0.5">
            All variants are at 0. The product will be marked as out of stock and hidden from search results.
          </p>
        </div>
      </div>
    );
  }
  if (outOfStock > 0 || lowStock > 0) {
    return (
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-amber-800">Stock alerts</p>
          {outOfStock > 0 && (
            <p className="text-xs text-amber-700">
              {outOfStock} variant{outOfStock > 1 ? "s" : ""} out of stock — stock 0
            </p>
          )}
          {lowStock > 0 && (
            <p className="text-xs text-amber-700">
              {lowStock} variant{lowStock > 1 ? "s" : ""} in low stock (≤ {threshold} units)
            </p>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded text-xs text-green-700">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      Stock OK — {total} unit{total > 1 ? "s" : ""} available
    </div>
  );
}
