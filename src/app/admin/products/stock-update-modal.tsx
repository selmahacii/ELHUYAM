"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Boxes, Plus, Minus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Variant {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  image: string | null;
  stock: number;
  price?: number | null;
  costPrice?: number | null;
}

interface Product {
  id: string;
  title: string;
  stock: number;
  variants: any[];
}

export default function StockUpdateModal({ product }: { product: Product }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [baseStock, setBaseStock] = useState(product?.stock ?? 0);

  const hasVariants = (product?.variants || []).length > 0;

  useEffect(() => {
    if (open && hasVariants && product?.id) {
      setLoading(true);
      fetch(`/api/products/${product.id}/variants`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setVariants(data.data);
          } else {
            toast.error("Failed to load variants");
          }
        })
        .catch(() => toast.error("Error loading variants"))
        .finally(() => setLoading(false));
    } else if (open) {
      setBaseStock(product?.stock ?? 0);
    }
  }, [open, product?.id, product?.stock, hasVariants]);

  function adjustBaseStock(amount: number) {
    setBaseStock((prev) => Math.max(0, prev + amount));
  }

  function adjustVariantStock(index: number, amount: number) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, stock: Math.max(0, v.stock + amount) } : v))
    );
  }

  function handleVariantStockChange(index: number, value: string) {
    const val = parseInt(value) || 0;
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, stock: Math.max(0, val) } : v))
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (hasVariants) {
        const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

        // 1. Save updated variants array
        const varRes = await fetch(`/api/products/${product?.id}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(variants),
        });
        if (!varRes.ok) throw new Error("Failed to save variants stock");

        // 2. Sync product's aggregate stock
        const prodRes = await fetch(`/api/products/${product?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: totalStock }),
        });
        if (!prodRes.ok) throw new Error("Failed to sync total product stock");
        
        toast.success("Stock updated successfully");
      } else {
        // Update product base stock
        const prodRes = await fetch(`/api/products/${product?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stock: baseStock }),
        });
        const data = await prodRes.json();
        if (!data.success) throw new Error(data.error ?? "Failed to save stock");
        
        toast.success(`Stock updated to ${baseStock}`);
      }

      setOpen(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all duration-200 shadow-3xs"
          title="Update Stock"
        >
          <Boxes className="w-3.5 h-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border border-gray-150 rounded-2xl shadow-xl p-6">
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-display text-base text-slate-900 font-bold">Update Stock</DialogTitle>
          <DialogDescription className="text-xs text-slate-500 line-clamp-1">
            {product?.title}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {!hasVariants ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Stock</span>
                  <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">
                    {baseStock} units
                  </span>
                </div>

                <div className="flex items-center gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => adjustBaseStock(-1)}
                    className="p-2.5 border border-gray-250 hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-600 rounded-lg shadow-3xs"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    value={baseStock}
                    onChange={(e) => setBaseStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-24 text-center border border-gray-250 rounded-lg py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition-colors bg-white shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => adjustBaseStock(1)}
                    className="p-2.5 border border-gray-250 hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-600 rounded-lg shadow-3xs"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                  {[-10, -5, +5, +10].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => adjustBaseStock(amt)}
                      className="text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-250 px-2 py-1 rounded transition-colors shadow-3xs"
                    >
                      {amt > 0 ? `+${amt}` : amt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {variants.map((v, idx) => (
                  <div key={v.id || idx} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {[v.size, v.color].filter(Boolean).join(" / ") || "Standard"}
                      </p>
                      {v.colorHex && (
                        <span
                          className="inline-block w-3.5 h-3.5 rounded-full border border-zinc-350 mt-1 shadow-2xs"
                          style={{ backgroundColor: v.colorHex }}
                        />
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustVariantStock(idx, -1)}
                        className="p-1 border border-gray-255 hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-600 rounded shadow-3xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleVariantStockChange(idx, e.target.value)}
                        className="w-12 text-center border border-gray-255 rounded py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition-colors bg-white shadow-3xs"
                      />
                      <button
                        type="button"
                        onClick={() => adjustVariantStock(idx, 1)}
                        className="p-1 border border-gray-255 hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-600 rounded shadow-3xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {/* Quick increments */}
                      <button
                        type="button"
                        onClick={() => adjustVariantStock(idx, 5)}
                        className="text-[9px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-250 px-1.5 py-0.5 rounded transition-colors shadow-3xs"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 rounded-lg transition-colors border border-transparent"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition-all"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
