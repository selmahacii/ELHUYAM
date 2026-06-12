"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  Tag, 
  Loader2, 
  Ticket, 
  Calendar, 
  DollarSign, 
  Percent, 
  AlertCircle,
  HelpCircle,
  Eye,
  Sliders,
  Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minPurchase: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  productIds: string[];
  createdAt: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  discountPrice: number | null;
}

interface FormState {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: string;
  minPurchase: string;
  maxUses: string;
  isActive: boolean;
  expiresAt: string;
  productIds: string[];
}

const empty: FormState = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minPurchase: "",
  maxUses: "",
  isActive: true,
  expiresAt: "",
  productIds: [],
};

export default function CouponManager({ coupons: initial, products }: { coupons: Coupon[]; products: Product[] }) {
  const router = useRouter();
  
  // Bug fix: Synchronize coupons state with the initial prop when it updates (e.g. after router.refresh())
  const [coupons, setCoupons] = useState(initial);
  useEffect(() => {
    setCoupons(initial);
  }, [initial]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");

  function openCreate() { 
    setForm(empty); 
    setEditing(null); 
    setShowForm(true); 
    setProductSearch(""); 
  }

  function openEdit(c: Coupon) {
    setForm({
      code: c.code,
      discountType: c.discountType as "PERCENTAGE" | "FIXED",
      discountValue: String(c.discountValue),
      minPurchase: c.minPurchase != null ? String(c.minPurchase) : "",
      maxUses: c.maxUses != null ? String(c.maxUses) : "",
      isActive: c.isActive,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      productIds: c.productIds ?? [],
    });
    setEditing(c.id);
    setShowForm(true);
    setProductSearch("");
  }

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id) ? f.productIds.filter((p) => p !== id) : [...f.productIds, id],
    }));
  }

  async function handleSave() {
    if (!form.code.trim() || !form.discountValue) { 
      toast.error("Le code et la valeur de réduction sont requis"); 
      return; 
    }
    
    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minPurchase: form.minPurchase ? Number(form.minPurchase) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        isActive: form.isActive,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        productIds: form.productIds,
      };
      
      const res = await fetch(editing ? `/api/coupons/${editing}` : "/api/coupons", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (!data.success) { 
        toast.error(data.error ?? "Erreur lors de la sauvegarde"); 
        return; 
      }
      
      toast.success(editing ? "Coupon mis à jour avec succès" : "Nouveau coupon créé !");
      setShowForm(false);
      setEditing(null);
      
      // Forces App Router server-side fetch to run again
      router.refresh();
    } catch (error) {
      toast.error("Une erreur réseau est survenue");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer ce coupon définitivement ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { 
        toast.error(data.error ?? "Erreur"); 
        return; 
      }
      toast.success("Coupon supprimé");
      setCoupons((p) => p.filter((c) => c.id !== id));
      router.refresh();
    } catch (err) {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(null);
    }
  }

  async function toggleActive(c: Coupon) {
    try {
      const res = await fetch(`/api/coupons/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !c.isActive }),
      });
      const data = await res.json();
      if (!data.success) { 
        toast.error("Impossible de modifier le statut"); 
        return; 
      }
      setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, isActive: !x.isActive } : x));
      router.refresh();
    } catch (err) {
      toast.error("Erreur réseau");
    }
  }

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Statistics calculation
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.isActive && !(c.expiresAt && new Date(c.expiresAt) < new Date())).length;
  const totalUses = coupons.reduce((acc, c) => acc + c.usedCount, 0);

  return (
    <div className="space-y-6">
      
      {/* ── Coupons Stats Cards Dashboard ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total Coupons</p>
            <h3 className="text-xl font-bold text-slate-900 mt-1">{totalCoupons}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Coupons Actifs</p>
            <h3 className="text-xl font-bold text-emerald-600 mt-1">{activeCoupons}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Utilisations Totales</p>
            <h3 className="text-xl font-bold text-brand-900 mt-1">{totalUses}</h3>
          </div>
          <div className="p-2.5 bg-brand-50 border border-brand-100 rounded-xl text-brand-900">
            <Check className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ── Actions Row ───────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center bg-white border border-gray-200 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <Ticket className="w-4 h-4 text-slate-800 shrink-0" />
          <span className="text-xs font-bold text-slate-800">Gérez vos codes promotionnels</span>
        </div>
        {!showForm && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all h-9"
          >
            <Plus className="w-4 h-4" /> Nouveau coupon
          </button>
        )}
      </div>

      {/* ── Form: Nouveau / Modifier Coupon (Inline Panel) ──────────────────── */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-slate-50 border border-gray-100 rounded-lg text-slate-800">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-900">
                  {editing ? "Modifier le coupon" : "Créer un nouveau coupon"}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Définissez les règles et les limites de votre réduction.
                </p>
              </div>
            </div>
            <button 
              onClick={() => { setShowForm(false); setEditing(null); }} 
              className="w-8 h-8 rounded-full hover:bg-gray-50 flex items-center justify-center text-gray-400 hover:text-slate-950 transition-colors border border-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {/* Coupon Code */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Code du Coupon *</label>
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase())}
                placeholder="Ex: RAMADAN20, ELEGANCE5"
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Type de Réduction</label>
              <select 
                value={form.discountType} 
                onChange={(e) => set("discountType", e.target.value as "PERCENTAGE" | "FIXED")} 
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10"
              >
                <option value="PERCENTAGE">Pourcentage (%)</option>
                <option value="FIXED">Montant fixe (DZD)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                Valeur de réduction * {form.discountType === "PERCENTAGE" ? "(%)" : "(DZD)"}
              </label>
              <input 
                type="number" 
                min="0" 
                max={form.discountType === "PERCENTAGE" ? "100" : undefined}
                value={form.discountValue} 
                onChange={(e) => set("discountValue", e.target.value)} 
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10"
                placeholder={form.discountType === "PERCENTAGE" ? "Ex: 20" : "Ex: 1500"}
              />
            </div>

            {/* Min Purchase */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Minimum de commande (DZD)</label>
              <input 
                type="number" 
                min="0" 
                value={form.minPurchase} 
                onChange={(e) => set("minPurchase", e.target.value)}
                placeholder="Aucun minimum (Optionnel)" 
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10"
              />
            </div>

            {/* Max Uses */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Utilisations Maximales</label>
              <input 
                type="number" 
                min="1" 
                value={form.maxUses} 
                onChange={(e) => set("maxUses", e.target.value)}
                placeholder="Illimité" 
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10"
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">Date d&apos;expiration</label>
              <input 
                type="date" 
                value={form.expiresAt} 
                onChange={(e) => set("expiresAt", e.target.value)} 
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10"
              />
            </div>
          </div>

          {/* Active status checkbox */}
          <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between border border-slate-100">
            <span className="text-xs font-bold text-slate-800">Activer le coupon immédiatement</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.isActive} 
                onChange={(e) => set("isActive", e.target.checked)} 
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Targeted Products Section */}
          <div className="border border-dashed border-gray-200 rounded-3xl p-5 space-y-3 bg-white">
            <div className="flex items-center gap-2 justify-between flex-wrap">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-400 shrink-0" />
                <h4 className="text-xs font-bold text-slate-800">Produits ciblés par la réduction</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                {form.productIds.length === 0 
                  ? "S'applique à TOUTE la boutique" 
                  : `${form.productIds.length} produit${form.productIds.length > 1 ? "s" : ""} sélectionné${form.productIds.length > 1 ? "s" : ""}`}
              </span>
            </div>
            
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Rechercher un article spécifique..."
              className="w-full border border-gray-200 rounded-2xl px-4 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-9"
            />
            
            <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-2xl divide-y divide-gray-50 p-1">
              {filteredProducts.length === 0 && (
                <p className="px-3 py-4 text-xs text-gray-400 italic text-center">Aucun produit trouvé</p>
              )}
              {filteredProducts.map((p) => (
                <label key={p.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 rounded-xl transition-colors">
                  <input
                    type="checkbox"
                    checked={form.productIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    className="w-4 h-4 accent-slate-900 shrink-0 rounded-md"
                  />
                  <span className="text-xs text-slate-800 flex-1 min-w-0 truncate font-medium">{p.title}</span>
                  <span className="text-xs font-bold text-slate-700 shrink-0">
                    {p.discountPrice ? (
                      <><span className="text-slate-950">{formatPrice(p.discountPrice)}</span> <span className="line-through text-slate-400 ml-1 font-medium">{formatPrice(p.price)}</span></>
                    ) : formatPrice(p.price)}
                  </span>
                </label>
              ))}
            </div>
            
            {form.productIds.length > 0 && (
              <button
                type="button"
                onClick={() => set("productIds", [])}
                className="text-[10px] text-red-500 font-bold hover:underline"
              >
                × Retirer toutes les restrictions (appliquer à toute la boutique)
              </button>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-3 text-xs font-semibold shadow-sm transition-all disabled:opacity-40 h-11"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Check className="w-4 h-4" />}
              {editing ? "Enregistrer les modifications" : "Créer et activer le coupon"}
            </button>
            <button 
              onClick={() => { setShowForm(false); setEditing(null); }} 
              className="px-6 py-3 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-700 rounded-2xl transition-all h-11"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* ── Coupons List Table ────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {["Code", "Réduction", "Utilisation", "Min. Commande", "Restriction Produits", "Expiration", "Statut", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300">
                        <Ticket className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Aucun coupon disponible pour le moment.</p>
                    </div>
                  </td>
                </tr>
              )}
              {coupons.map((c) => {
                const expired = !!(c.expiresAt && new Date(c.expiresAt) < new Date());
                const exhausted = c.maxUses != null && c.usedCount >= c.maxUses;
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    {/* Code */}
                    <td className="px-5 py-4">
                      <span className="inline-block font-mono text-[11px] font-bold tracking-wider uppercase bg-brand-50 border border-brand-100/50 text-brand-900 rounded-lg px-2.5 py-1">
                        {c.code}
                      </span>
                    </td>
                    
                    {/* Reduction */}
                    <td className="px-5 py-4 font-bold text-xs text-slate-900">
                      {c.discountType === "PERCENTAGE" ? (
                        <span className="inline-flex items-center gap-1">
                          {c.discountValue}% <Percent className="w-3.5 h-3.5 text-slate-400" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-900">
                          {formatPrice(c.discountValue)}
                        </span>
                      )}
                    </td>
                    
                    {/* Utilisation */}
                    <td className="px-5 py-4 text-xs font-semibold text-slate-600">
                      <span>{c.usedCount}</span>
                      <span className="text-slate-400 font-medium">
                        {c.maxUses != null ? ` / ${c.maxUses}` : " / ∞"}
                      </span>
                      {exhausted && (
                        <span className="ml-1.5 text-[9px] uppercase font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100">
                          Épuisé
                        </span>
                      )}
                    </td>
                    
                    {/* Minimum purchase */}
                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      {c.minPurchase != null ? (
                        <span className="font-bold text-slate-900">{formatPrice(c.minPurchase)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    
                    {/* Products limitation */}
                    <td className="px-5 py-4">
                      {c.productIds?.length > 0 ? (
                        <span className="inline-flex items-center text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg border border-blue-100">
                          {c.productIds.length} article{c.productIds.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Toute la boutique</span>
                      )}
                    </td>
                    
                    {/* Expire */}
                    <td className="px-5 py-4 text-xs font-medium">
                      {c.expiresAt ? (
                        <span className={`flex items-center gap-1.5 ${expired ? "text-red-500 font-semibold" : "text-slate-600"}`}>
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          {c.expiresAt.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    
                    {/* Status Badge */}
                    <td className="px-5 py-4">
                      <button 
                        onClick={() => toggleActive(c)} 
                        className="cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                        title="Cliquez pour activer/désactiver"
                      >
                        {c.isActive && !expired && !exhausted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Actif
                          </span>
                        ) : expired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-rose-50 border border-rose-200 text-rose-800">
                            Expiré
                          </span>
                        ) : exhausted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                            Épuisé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-slate-50 border border-slate-200 text-slate-600">
                            Inactif
                          </span>
                        )}
                      </button>
                    </td>
                    
                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEdit(c)} 
                          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
                          title="Modifier le coupon"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c.id)} 
                          disabled={deleting === c.id} 
                          className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-40"
                          title="Supprimer le coupon"
                        >
                          {deleting === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
