"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Key,
  ExternalLink,
  Copy,
  Info,
  ShieldCheck,
  Truck,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  initialConfigured: boolean;
  initialTenantId: string;
}

export default function DeliverySettingsClient({ initialConfigured, initialTenantId }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [secretKey, setSecretKey] = useState("");
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configured, setConfigured] = useState(initialConfigured);
  const [connected, setConnected] = useState<boolean | null>(null);

  async function handleSave() {
    if (!secretKey.trim() && !configured) {
      toast.error("La clé secrète est requise pour une nouvelle configuration");
      return;
    }
    if (!tenantId.trim()) {
      toast.error("L'identifiant boutique (Tenant ID) est requis");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/delivery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secretKey: secretKey.trim() || "__KEEP__",
          tenantId: tenantId.trim()
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Erreur lors de la sauvegarde");
        return;
      }

      setConfigured(true);
      setConnected(data.data.connected);

      if (data.data.connected) {
        toast.success("Connexion établie avec ZR Express !");
      } else {
        toast.success("Paramètres enregistrés !");
      }
    } catch (err) {
      toast.error("Une erreur réseau est survenue");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setConnected(null);
    try {
      const res = await fetch("/api/admin/delivery-settings");
      const data = await res.json();
      if (!data.success || !data.data.configured) {
        toast.error("Aucune configuration trouvée.");
        return;
      }
      const testRes = await fetch("/api/admin/delivery-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          secretKey: secretKey.trim() || "__KEEP__", 
          tenantId: tenantId.trim() 
        }),
      });
      const testData = await testRes.json();
      setConnected(testData.data?.connected ?? false);
      if (testData.data?.connected) {
        toast.success("La connexion avec ZR Express fonctionne parfaitement ✓");
      } else {
        toast.error("Échec de connexion : vérifiez vos clés chez ZR Express");
      }
    } catch (err) {
      toast.error("Impossible de joindre le service de test");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Slim Header with Integrated Status ────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs tracking-wider uppercase">
            <Truck className="w-4 h-4 text-slate-800 shrink-0" /> Partenaire Livraison Officiel
          </div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">
            Suivi automatique des colis avec ZR Express
          </h1>
          <p className="text-slate-600 text-xs font-medium max-w-2xl leading-relaxed">
            Connectez votre boutique en 3 étapes simples pour permettre à vos clients de suivre leur colis en temps réel directement depuis votre site, sans aucune action manuelle requise de votre part.
          </p>
        </div>
        
        {/* Slim Status Badge */}
        <div className={`flex items-center gap-3 p-2.5 px-4 rounded-2xl border shrink-0 bg-white shadow-sm ${
          configured ? "border-emerald-200" : "border-amber-200"
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${configured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
          <span className="text-xs font-bold text-slate-800">
            {configured ? "ZR Express Activé" : "Connexion en attente"}
          </span>
          {connected !== null && (
            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border ${
              connected 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                : "bg-rose-50 text-rose-700 border-rose-200"
            }`}>
              {connected ? "Liaison OK" : "Erreur"}
            </span>
          )}
        </div>
      </div>

      {/* ── Compact Dashboard Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Activation and Inputs (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">
                🔑 Activation de la Connexion
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Saisissez les informations de votre compte professionnel ZR Express.
              </p>
            </div>
            <a 
              href="https://client.zrexpress.dz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-[11px] text-slate-600 hover:text-black font-semibold bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 transition-all w-full sm:w-auto"
            >
              ZR Express <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* Secret Key Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Clé secrète (Secret Key) *
                </label>
                <span className="text-[10px] text-slate-500 font-medium">À copier depuis ZR Express</span>
              </div>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder={configured ? "●●●●●●●● (Clé déjà configurée avec succès)" : "Exemple: yCEKo00Rh5BTs8Lf..."}
                  className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all pr-12 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Tenant ID Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                  Identifiant Boutique (Tenant ID) *
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Requis pour l&apos;authentification</span>
              </div>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="Exemple: ceb3efb2-31af-417f-a505-c3235ed9c875"
                className="w-full border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-mono text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-11"
              />
            </div>

            {/* Button Row */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                variant="luxury" 
                type="submit"
                loading={saving} 
                className="w-full sm:flex-1 rounded-2xl text-xs font-semibold h-11 shadow-sm transition-all"
              >
                Enregistrer la configuration
              </Button>
              {configured && (
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="w-full sm:flex-1 rounded-2xl text-xs font-semibold h-11 border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-1.5 px-5"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" /> : <Wifi className="w-3.5 h-3.5 text-slate-600" />}
                  Tester la connexion
                </Button>
              )}
            </div>
          </form>

          <div className="pt-2 border-t border-gray-100 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-500 leading-relaxed">
              <strong>Sécurité :</strong> Vos clés de connexion sont chiffrées dans votre base de données et ne sont jamais partagées à des tiers.
            </p>
          </div>
        </div>

        {/* Right Side: Webhook & Quick Guide (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Webhook URL Box */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-1.5">
                ⚡ Synchronisation Automatique
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                Permettez à ZR Express de mettre à jour le statut des colis automatiquement à chaque étape de la livraison.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-slate-50 border border-gray-100 rounded-2xl p-2.5">
                <code className="text-[10px] font-mono text-slate-700 flex-1 truncate select-all py-1 sm:py-0 text-center sm:text-left">
                  {mounted && typeof window !== "undefined" ? window.location.origin : "https://votre-boutique.com"}/api/webhooks/zrexpress
                </code>
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== "undefined" ? window.location.origin : "https://votre-boutique.com";
                    const url = `${origin}/api/webhooks/zrexpress`;
                    navigator.clipboard.writeText(url);
                    toast.success("Lien de synchronisation copié ✓");
                  }}
                  className="flex items-center justify-center gap-1 text-[10px] text-slate-800 hover:text-black font-bold uppercase w-full sm:w-auto shrink-0 transition-colors bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm"
                >
                  <Copy className="w-3 h-3" /> Copier
                </button>
              </div>
            </div>

            <div className="flex gap-2.5 bg-blue-50/50 p-3 rounded-2xl">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-900 leading-relaxed">
                <strong>Où coller ce lien ?</strong> Dans votre espace ZR Express → <strong>Paramètres</strong> → <strong>Webhook</strong>. Collez ce lien et sauvegardez pour un suivi automatique.
              </p>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
              <HelpCircle className="w-4.5 h-4.5 text-slate-800 shrink-0" />
              <h3 className="font-display text-sm font-bold text-slate-900">
                Guide de Démarrage Rapide
              </h3>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Copiez vos clés depuis votre compte client <span className="font-semibold text-slate-900">ZR Express</span> (rubrique API).
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Collez-les et enregistrez dans le formulaire de gauche, puis validez avec <span className="font-semibold text-slate-900">Tester la connexion</span>.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Lors de l&apos;expédition d&apos;une commande, renseignez son <strong>N° de suivi ZR Express</strong> sur sa fiche pour activer le suivi en direct.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
