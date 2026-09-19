"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "react-hot-toast";
import StockUpdateModal from "./stock-update-modal";

interface Product {
  id: string;
  title: string;
  featured: boolean;
  bestseller: boolean;
  newArrival: boolean;
  stock: number;
  variants: any[];
}

export default function ProductRowActions({ product }: { product: Product }) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Échec de la suppression");
      }
      toast.success(data.message || "Produit et photos supprimés avec succès");
      setShowDeleteModal(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue lors de la suppression");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <div className="inline-flex items-center bg-slate-50 border border-slate-200/80 rounded-xl p-0.5 shadow-2xs group-hover:border-slate-300/80 transition-all duration-200">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all duration-200 shadow-3xs"
          title="Modifier le produit"
        >
          <Edit className="w-3.5 h-3.5" />
        </Link>

        <div className="w-px h-4.5 bg-slate-200 mx-0.5 shrink-0" />

        <StockUpdateModal product={product} />

        <div className="w-px h-4.5 bg-slate-200 mx-0.5 shrink-0" />

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 shadow-3xs cursor-pointer"
          title="Supprimer définitivement le produit et ses photos"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 cursor-default text-left"
          onClick={(e) => {
            e.stopPropagation();
            if (!isDeleting) setShowDeleteModal(false);
          }}
        >
          <div
            className="bg-white border border-red-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-zinc-900">Suppression Définitive</h3>
                <p className="text-xs text-zinc-500">Produit, médias Cloudinary & variantes</p>
              </div>
            </div>

            <p className="text-sm text-zinc-600 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement le produit{" "}
              <strong className="text-zinc-900 font-semibold">{product.title}</strong> ?
              <br />
              <span className="text-xs text-red-600 mt-2 block">
                ⚠️ Toutes les photos Cloudinary, variantes, avis et données liées à ce produit seront supprimées.
              </span>
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Suppression...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer définitivement</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
