"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, X, Plus, Minus, Boxes, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Variant {
  id: string;
  size?: string | null;
  color?: string | null;
  colorHex?: string | null;
  image?: string | null;
  stock: number;
}

interface ProductInfo {
  id: string;
  title: string;
  stock: number;
  variants?: Variant[];
}

interface StockEditorProps {
  productId?: string;
  initialStock?: number;
  product?: ProductInfo;
}

export default function StockEditor({ productId: propId, initialStock: propStock, product: propProduct }: StockEditorProps) {
  const router = useRouter();

  const id = propProduct?.id || propId || "";
  const title = propProduct?.title || "Produit";
  const initialStock = propProduct ? propProduct.stock : (propStock ?? 0);
  const variantsList = propProduct?.variants || [];
  const hasVariants = variantsList.length > 0;

  // Simple product state
  const [currentStock, setCurrentStock] = useState(initialStock);
  const [editingSimple, setEditingSimple] = useState(false);
  const [inputValue, setInputValue] = useState(String(initialStock));
  const [savingSimple, setSavingSimple] = useState(false);

  // Variant product state
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [savingVariants, setSavingVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>(variantsList);
  const [bulkSetVal, setBulkSetVal] = useState("");

  useEffect(() => {
    setCurrentStock(initialStock);
    setInputValue(String(initialStock));
  }, [initialStock]);

  useEffect(() => {
    if (variantModalOpen && hasVariants && id) {
      setLoadingVariants(true);
      fetch(`/api/products/${id}/variants`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setVariants(data.data);
          }
        })
        .catch(() => toast.error("Erreur lors du chargement des variantes"))
        .finally(() => setLoadingVariants(false));
    }
  }, [variantModalOpen, hasVariants, id]);

  // ── Simple Product Handler ──────────────────────────────────────────────
  async function handleSaveSimple(targetStock?: number) {
    const stockToSave = targetStock !== undefined ? targetStock : Number(inputValue);
    if (isNaN(stockToSave) || stockToSave < 0) {
      toast.error("Veuillez saisir une valeur de stock valide (≥ 0)");
      return;
    }

    setSavingSimple(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock: stockToSave }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error ?? "Échec de la mise à jour");

      setCurrentStock(stockToSave);
      setInputValue(String(stockToSave));
      setEditingSimple(false);
      toast.success(`Stock mis à jour : ${stockToSave} unité(s)`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour du stock");
    } finally {
      setSavingSimple(false);
    }
  }

  function quickAddSimple(amount: number) {
    const nextStock = Math.max(0, currentStock + amount);
    handleSaveSimple(nextStock);
  }

  // ── Variant Product Handlers ────────────────────────────────────────────
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

  function applyToAllVariants(amount: number, isAbsolute = false) {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        stock: isAbsolute ? Math.max(0, amount) : Math.max(0, v.stock + amount),
      }))
    );
  }

  async function handleSaveVariants() {
    setSavingVariants(true);
    try {
      const varRes = await fetch(`/api/products/${id}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(variants),
      });
      const varData = await varRes.json();
      if (!varData.success) throw new Error(varData.error || "Échec de l'enregistrement des variantes");

      const newTotal = variants.reduce((s, v) => s + (v.stock || 0), 0);
      setCurrentStock(newTotal);
      setVariantModalOpen(false);
      toast.success(`Stock des variantes mis à jour (Total: ${newTotal})`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement");
    } finally {
      setSavingVariants(false);
    }
  }

  // ── RENDER ──────────────────────────────────────────────────────────────
  if (hasVariants) {
    const totalVariantStock = variants.reduce((s, v) => s + (v.stock || 0), 0);
    const outOfStockCount = variants.filter((v) => v.stock === 0).length;

    return (
      <>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            {totalVariantStock === 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Rupture (0)
              </span>
            )}
            {totalVariantStock > 0 && totalVariantStock <= 5 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Faible ({totalVariantStock})
              </span>
            )}
            {totalVariantStock > 5 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                {totalVariantStock} en stock
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setVariantModalOpen(true)}
              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-250 hover:border-slate-400 rounded-md transition-all shadow-3xs hover:shadow-2xs cursor-pointer"
              title="Modifier le stock des variantes"
            >
              <Boxes className="w-3 h-3 text-slate-500" />
              <span>{variants.length} var.</span>
              {outOfStockCount > 0 && (
                <span className="text-[9px] text-rose-600 font-extrabold">({outOfStockCount} épuisée{outOfStockCount > 1 ? "s" : ""})</span>
              )}
            </button>
          </div>
        </div>

        {/* Dialog for Variant Stock Management */}
        <Dialog open={variantModalOpen} onOpenChange={setVariantModalOpen}>
          <DialogContent className="sm:max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-display text-base text-slate-900 font-bold flex items-center gap-2">
                <Boxes className="w-4 h-4 text-slate-700" />
                Gestion du Stock par Variante
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 line-clamp-1">
                {title}
              </DialogDescription>
            </DialogHeader>

            {loadingVariants ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-700" />
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* Bulk Actions Header */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Actions rapides sur toutes les variantes :</span>
                    <span className="font-mono text-slate-500 font-semibold">
                      Total: <strong className="text-slate-900">{variants.reduce((s, v) => s + (v.stock || 0), 0)}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => applyToAllVariants(1)}
                      className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors shadow-3xs"
                    >
                      +1 à toutes
                    </button>
                    <button
                      type="button"
                      onClick={() => applyToAllVariants(5)}
                      className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors shadow-3xs"
                    >
                      +5 à toutes
                    </button>
                    <button
                      type="button"
                      onClick={() => applyToAllVariants(10)}
                      className="px-2 py-1 text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-700 transition-colors shadow-3xs"
                    >
                      +10 à toutes
                    </button>
                    <button
                      type="button"
                      onClick={() => applyToAllVariants(0, true)}
                      className="px-2 py-1 text-[10px] font-bold bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded text-rose-700 transition-colors shadow-3xs"
                    >
                      Mettre à 0
                    </button>
                  </div>
                </div>

                {/* List of Variants */}
                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {variants.map((v, idx) => (
                    <div
                      key={v.id || idx}
                      className="flex items-center justify-between gap-3 p-2.5 bg-white border border-slate-100 rounded-xl hover:border-slate-200 transition-colors"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        {v.colorHex && (
                          <span
                            className="w-4 h-4 rounded-full border border-slate-300 shrink-0 shadow-3xs"
                            style={{ backgroundColor: v.colorHex }}
                          />
                        )}
                        <div>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {[v.color, v.size].filter(Boolean).join(" · ") || "Variante Standard"}
                          </p>
                          <span className={`text-[10px] font-semibold ${v.stock === 0 ? "text-rose-600 font-bold" : v.stock <= 5 ? "text-amber-600" : "text-slate-500"}`}>
                            {v.stock === 0 ? "Rupture de stock" : `${v.stock} en stock`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => adjustVariantStock(idx, -1)}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => handleVariantStockChange(idx, e.target.value)}
                          className="w-14 text-center border border-slate-300 rounded-lg py-1 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-800 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => adjustVariantStock(idx, 1)}
                          className="w-7 h-7 flex items-center justify-center border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustVariantStock(idx, 5)}
                          className="px-1.5 py-1 text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-colors"
                        >
                          +5
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setVariantModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVariants}
                    disabled={savingVariants}
                    className="inline-flex items-center justify-center gap-1.5 bg-black hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                  >
                    {savingVariants ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Enregistrer le stock</span>
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Simple Product View
  if (editingSimple) {
    return (
      <div className="flex flex-col gap-1.5 bg-white border border-slate-300 p-2 rounded-xl shadow-lg z-10 min-w-[150px]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setInputValue(String(Math.max(0, (parseInt(inputValue) || 0) - 1)))}
            className="p-1 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="number"
            min="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveSimple();
              if (e.key === "Escape") setEditingSimple(false);
            }}
            autoFocus
            className="w-16 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-center font-bold text-slate-900 focus:outline-none focus:border-black bg-white"
          />
          <button
            type="button"
            onClick={() => setInputValue(String((parseInt(inputValue) || 0) + 1))}
            className="p-1 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Quick add buttons */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
          <div className="flex gap-1">
            {[1, 5, 10].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setInputValue(String((parseInt(inputValue) || 0) + amt))}
                className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded"
              >
                +{amt}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => handleSaveSimple()}
              disabled={savingSimple}
              className="p-1 bg-black text-white hover:bg-slate-800 rounded disabled:opacity-50"
              title="Enregistrer"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingSimple(false);
                setInputValue(String(currentStock));
              }}
              className="p-1 text-slate-400 hover:bg-slate-100 rounded"
              title="Annuler"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group/stock">
      <div className="flex flex-col">
        {currentStock === 0 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Rupture (0)
          </span>
        ) : currentStock <= 5 ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Faible ({currentStock})
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
            {currentStock} en stock
          </span>
        )}

        {/* Quick +1, +5 buttons on hover */}
        <div className="flex items-center gap-1 mt-1">
          <button
            type="button"
            onClick={() => quickAddSimple(1)}
            disabled={savingSimple}
            className="px-1.5 py-0.5 text-[9px] font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded shadow-3xs cursor-pointer"
            title="Ajouter 1 unité"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => quickAddSimple(5)}
            disabled={savingSimple}
            className="px-1.5 py-0.5 text-[9px] font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded shadow-3xs cursor-pointer"
            title="Ajouter 5 unités"
          >
            +5
          </button>
          <button
            type="button"
            onClick={() => setEditingSimple(true)}
            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
            title="Saisir la quantité exacte"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
