"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Check, X, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props { reviewId: string; status: string; }

export default function PublicReviewActions({ reviewId, status }: Props) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [loading, setLoading] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function moderate(action: "APPROVED" | "REJECTED") {
    setLoading(action);
    try {
      const res = await fetch(`/api/public-reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });
      const data = await res.json();
      if (!data.success) { 
        toast.error(data.error ?? t("modError")); 
        return; 
      }
      toast.success(action === "APPROVED" ? t("modApprovedSuccess") : t("modRejectedSuccess"));
      router.refresh();
    } catch {
      toast.error(t("networkError"));
    } finally {
      setLoading(null);
    }
  }

  async function remove() {
    setShowDeleteConfirm(false);
    setLoading("DELETE");
    try {
      const res = await fetch(`/api/public-reviews/${reviewId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) { 
        toast.error(data.error ?? t("deleteError")); 
        return; 
      }
      toast.success(t("deleteSuccess"));
      router.refresh();
    } catch {
      toast.error(t("networkError"));
    } finally {
      setLoading(null);
    }
  }

  const isWorking = loading !== null;

  return (
    <>
      <div className="flex items-center gap-1.5 shrink-0 self-center">
        {status !== "APPROVED" && (
          <button
            onClick={() => moderate("APPROVED")}
            disabled={isWorking}
            title={t("approveTitle")}
            className="p-2 text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center h-9 w-9"
          >
            {loading === "APPROVED" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        )}
        {status !== "REJECTED" && (
          <button
            onClick={() => moderate("REJECTED")}
            disabled={isWorking}
            title={t("rejectTitle")}
            className="p-2 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center h-9 w-9"
          >
            {loading === "REJECTED" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <X className="w-4 h-4" />
            )}
          </button>
        )}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isWorking}
          title={t("deleteTitle")}
          className="p-2 text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center h-9 w-9"
        >
          {loading === "DELETE" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Modern custom delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 transition-all duration-300">
          <div 
            className="bg-white border border-slate-200/85 rounded-3xl p-6 shadow-2xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200 space-y-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex gap-4">
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-500 shrink-0 self-start">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="font-display text-base font-bold text-slate-900">
                  {t("deleteConfirmTitle")}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                  {t("deleteReviewConfirm")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 text-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                {t("deleteConfirmCancel")}
              </button>
              <button
                type="button"
                onClick={remove}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("deleteConfirmConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
