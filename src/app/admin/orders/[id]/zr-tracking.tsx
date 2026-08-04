"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, MapPin, Package, CheckCircle2, Truck, Clock, XCircle } from "lucide-react";

interface ZRParcel {
  id: string;
  trackingNumber: string;
  stateName?: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  wilaya?: string;
  amount?: number;
  updatedAt?: string;
}

interface ZRHistoryEntry {
  id: string;
  stateName: string;
  stateDate: string;
  note?: string;
  agentName?: string;
}

function StateIcon({ name }: { name?: string }) {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("livré") || lower.includes("delivered") || lower.includes("encaiss") || lower.includes("livre") || lower.includes("recouv"))
    return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
  if (lower.includes("transit") || lower.includes("livraison") || lower.includes("wilaya"))
    return <Truck className="w-4 h-4 text-blue-500 shrink-0" />;
  if (lower.includes("annul") || lower.includes("retour") || lower.includes("échou") || lower.includes("echou"))
    return <XCircle className="w-4 h-4 text-red-500 shrink-0" />;
  if (lower.includes("récupéré") || lower.includes("recupere") || lower.includes("picked") || lower.includes("bureau") || lower.includes("dispatch") || lower.includes("expédier") || lower.includes("expedier") || lower.includes("confirm") || lower.includes("reçu") || lower.includes("recue"))
    return <Package className="w-4 h-4 text-amber-500 shrink-0" />;
  return <Clock className="w-4 h-4 text-gray-400 shrink-0" />;
}

function stateBadgeClass(name?: string): string {
  const lower = (name ?? "").toLowerCase();
  if (lower.includes("livré") || lower.includes("delivered") || lower.includes("encaiss") || lower.includes("livre") || lower.includes("recouv")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (lower.includes("transit") || lower.includes("livraison") || lower.includes("wilaya")) return "bg-blue-50 text-blue-700 border-blue-200";
  if (lower.includes("annul") || lower.includes("retour") || lower.includes("échou") || lower.includes("echou")) return "bg-red-50 text-red-700 border-red-200";
  if (lower.includes("récupéré") || lower.includes("recupere") || lower.includes("picked") || lower.includes("bureau") || lower.includes("dispatch") || lower.includes("expédier") || lower.includes("expedier") || lower.includes("confirm") || lower.includes("reçu") || lower.includes("recue")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

function formatZRDate(dateStr?: string): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("fr-DZ", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function ZRTracking({ trackingNumber }: { trackingNumber: string }) {
  const [parcel, setParcel] = useState<ZRParcel | null>(null);
  const [history, setHistory] = useState<ZRHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTracking = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/zr-tracking/${encodeURIComponent(trackingNumber)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setParcel(data.data.parcel);
        setHistory(data.data.history ?? []);
        setLastUpdated(new Date());
      } else {
        setError(data.error ?? "Unable to retrieve tracking information");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [trackingNumber]);

  // Initial load + poll every 60s. Order status itself is already kept in
  // sync server-side by the ZR webhook regardless of whether this tab is
  // open; this poll only refreshes the live tracking widget's display, and
  // the API route caches ZR's response for 30s, so this interval mostly
  // just re-reads that cache rather than re-hitting ZR Express.
  useEffect(() => {
    fetchTracking();
    const interval = setInterval(() => fetchTracking(true), 60_000);
    return () => clearInterval(interval);
  }, [fetchTracking]);

  return (
    <div className="bg-white border border-brand-100">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-100">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-500" />
          <h3 className="font-display text-base text-brand-900">ZR Express Tracking</h3>
          {parcel?.stateName && (
            <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 border font-medium ${stateBadgeClass(parcel.stateName)}`}>
              {parcel.stateName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-brand-300 hidden sm:block">
              Updated {formatZRDate(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={() => fetchTracking()}
            disabled={loading}
            className="p-1.5 text-brand-400 hover:text-brand-900 hover:bg-brand-50 rounded transition-colors disabled:opacity-40"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
        {loading && !parcel && (
          <div className="flex items-center gap-2 text-brand-400 text-sm py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading tracking...
          </div>
        )}

        {error && !parcel && (
          <p className="text-sm text-red-500 py-2">{error}</p>
        )}

        {parcel && (
          <div className="space-y-5">
            {/* Parcel info strip */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-400 mb-0.5">Tracking number</p>
                <p className="font-mono text-brand-900 font-medium">{parcel.trackingNumber}</p>
              </div>
              {parcel.wilaya && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-400 mb-0.5">Wilaya</p>
                  <p className="text-brand-700">{parcel.wilaya}</p>
                </div>
              )}
              {parcel.amount !== undefined && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-400 mb-0.5">COD Amount</p>
                  <p className="text-brand-700">{parcel.amount.toLocaleString("fr-DZ")} DZD</p>
                </div>
              )}
              {parcel.updatedAt && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-brand-400 mb-0.5">Last update</p>
                  <p className="text-brand-700">{formatZRDate(parcel.updatedAt)}</p>
                </div>
              )}
            </div>

            {/* State history timeline */}
            {history.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-brand-400 mb-3">Status history</p>
                <div className="space-y-0">
                  {[...history].reverse().map((h, i) => (
                    <div key={h.id ?? i} className="flex gap-3">
                      <div className="flex flex-col items-center pt-0.5">
                        <StateIcon name={h.stateName} />
                        {i < history.length - 1 && <div className="w-px flex-1 bg-brand-100 mt-1 mb-1 min-h-[16px]" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-medium text-brand-900">{h.stateName}</p>
                        {h.note && <p className="text-xs text-brand-400">{h.note}</p>}
                        {h.agentName && <p className="text-xs text-brand-400">Agent: {h.agentName}</p>}
                        <p className="text-xs text-brand-300 mt-0.5">{formatZRDate(h.stateDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.length === 0 && (
              <p className="text-xs text-brand-400 italic">No history available.</p>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-3">
        <p className="text-[9px] text-brand-300 uppercase tracking-widest">
          Auto-refresh every 30 seconds · ZR Express
        </p>
      </div>
    </div>
  );
}
