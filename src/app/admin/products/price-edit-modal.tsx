"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Check, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

interface Props {
  productId: string;
  title: string;
  price: number;
  discountPrice: number | null;
  priceEur: number;
  discountPriceEur: number | null;
}

export default function PriceEditModal({
  productId,
  title,
  price: initialPrice,
  discountPrice: initialDiscount,
  priceEur: initialPriceEur,
  discountPriceEur: initialDiscountEur
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(String(initialPrice));
  const [discountPrice, setDiscountPrice] = useState(initialDiscount != null ? String(initialDiscount) : "");
  const [priceEur, setPriceEur] = useState(String(initialPriceEur));
  const [discountPriceEur, setDiscountPriceEur] = useState(initialDiscountEur != null ? String(initialDiscountEur) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const p = Number(price);
    const d = discountPrice.trim() ? Number(discountPrice) : null;
    const pEur = Number(priceEur);
    const dEur = discountPriceEur.trim() ? Number(discountPriceEur) : null;

    if (isNaN(p) || p <= 0) { toast.error("Invalid price (DZD)"); return; }
    if (d !== null && (isNaN(d) || d <= 0)) { toast.error("Invalid sale price (DZD)"); return; }
    if (isNaN(pEur) || pEur < 0) { toast.error("Invalid price (EUR)"); return; }
    if (dEur !== null && (isNaN(dEur) || dEur < 0)) { toast.error("Invalid sale price (EUR)"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: p,
          discountPrice: d,
          priceEur: pEur,
          discountPriceEur: dEur
        }),
      });
      const data = await res.json();
      if (!data.success) { toast.error(data.error ?? "Error"); return; }
      toast.success("Prices updated successfully");
      setOpen(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 text-gray-300 hover:text-gray-600 transition-colors opacity-0 group-hover/price:opacity-100"
        title="Edit price"
      >
        <Pencil className="w-3 h-3" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && setOpen(false)} />
          <div className="relative bg-white w-full max-w-sm shadow-2xl">
            <div className="h-0.5 bg-gray-900 w-full" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-display text-base text-gray-900">Edit price</h3>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{title}</p>
                </div>
                <button onClick={() => !saving && setOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-semibold">Normal Price (DZD)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-700 bg-white"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-semibold">Sale Price (DZD)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discountPrice}
                      onChange={(e) => setDiscountPrice(e.target.value)}
                      placeholder="No sale"
                      className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-700 bg-white placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-semibold">Normal Price (EUR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={priceEur}
                      onChange={(e) => setPriceEur(e.target.value)}
                      className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-700 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-gray-500 mb-1.5 font-semibold">Sale Price (EUR)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountPriceEur}
                      onChange={(e) => setDiscountPriceEur(e.target.value)}
                      placeholder="No sale"
                      className="w-full border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-700 bg-white placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {discountPrice && Number(discountPrice) >= Number(price) && (
                  <p className="mt-1 text-xs text-amber-600">⚠ DZD Sale price must be lower than DZD price</p>
                )}
                {discountPriceEur && Number(discountPriceEur) >= Number(priceEur) && (
                  <p className="mt-1 text-xs text-amber-600">⚠ EUR Sale price must be lower than EUR price</p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={saving || (!!discountPrice && Number(discountPrice) >= Number(price)) || (!!discountPriceEur && Number(discountPriceEur) >= Number(priceEur))}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save
                </button>
                <button
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="flex-1 border border-gray-200 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
