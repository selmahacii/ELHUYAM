"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Coins, Save, Loader2, Info, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  initialRate: number;
}

export default function ExchangeRateBanner({ initialRate }: Props) {
  const [rate, setRate] = useState<number>(initialRate);
  const [savedRate, setSavedRate] = useState<number>(initialRate);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (isNaN(rate) || rate <= 0) {
      toast.error("Veuillez saisir un taux de change valide (ex: 270)");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/delivery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eurExchangeRate: rate }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedRate(rate);
        toast.success(`💱 Taux de change global mis à jour : 1 € = ${rate} DA`);
      } else {
        toast.error(data.error || "Erreur lors de l'enregistrement du taux");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  const isChanged = rate !== savedRate;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm sm:text-base font-bold text-slate-900">
                Taux de Change Global (EUR ➔ DZD)
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Square & Parallèle
              </span>
            </div>
            <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
              Ce taux s'applique <strong>à tous les produits du catalogue</strong> pour le calcul automatique des tarifs de livraison internationale au panier et checkout.
            </p>
          </div>
        </div>

        {/* Right: Input & Action */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 bg-white p-1.5 rounded-xl border border-amber-200/80 shadow-2xs">
          <div className="relative flex items-center">
            <span className="absolute left-3 text-xs font-bold text-slate-400 select-none">1 € =</span>
            <input
              type="number"
              step="0.5"
              min="1"
              value={rate}
              onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
              placeholder="270"
              className="w-32 border-0 bg-transparent pl-11 pr-8 py-1 text-sm font-extrabold font-mono text-slate-900 focus:outline-none transition-all h-8"
            />
            <span className="absolute right-2.5 text-xs font-bold text-slate-500 select-none">DA</span>
          </div>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving || !isChanged}
            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 h-8 transition-all shadow-xs ${
              isChanged
                ? "bg-amber-600 hover:bg-amber-700 text-white"
                : "bg-slate-100 text-slate-400 cursor-default hover:bg-slate-100"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Sauvegarde...
              </>
            ) : isChanged ? (
              <>
                <Save className="w-3.5 h-3.5" /> Appliquer
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Taux Actif
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Simulation Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-amber-200/50 text-[11px] text-slate-600">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-700">Aperçu direct :</span>
          <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-100">
            Colis 1 kg Europe (3 320 DA) :{" "}
            <strong className="text-amber-800 font-mono font-bold">
              {rate > 0 ? (3320 / rate).toFixed(2) : "0.00"} €
            </strong>
          </span>
          <span className="bg-white/80 px-2 py-0.5 rounded border border-amber-100">
            Colis 2 kg Golfe (6 010 DA) :{" "}
            <strong className="text-amber-800 font-mono font-bold">
              {rate > 0 ? (6010 / rate).toFixed(2) : "0.00"} €
            </strong>
          </span>
        </div>
        <span className="text-[10px] text-slate-400">
          Dernière valeur enregistrée : <strong>{savedRate} DA</strong>
        </span>
      </div>
    </div>
  );
}
