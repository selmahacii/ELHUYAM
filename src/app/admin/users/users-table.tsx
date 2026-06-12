"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Ban, Trash2, Shield, Users, ShoppingBag, Eye, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

type UserItem = {
  id: string;
  name: string | null;
  email: string | null;
  role: "CUSTOMER" | "CONFIRMATRICE" | "ADMIN";
  isBanned: boolean;
  createdAt: Date;
  _count: { orders: number };
};

export function UsersTable({ users, currentUserId }: { users: UserItem[]; currentUserId: string }) {
  const router = useRouter();
  const [banningId, setBanningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleToggleBan(user: UserItem) {
    setBanningId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isBanned: !user.isBanned,
          banReason: !user.isBanned ? "Banni par l'administrateur" : null,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Erreur lors de la mise à jour");
        return;
      }

      toast.success(user.isBanned ? "Utilisateur débanni avec succès" : "Utilisateur banni avec succès");
      router.refresh();
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setBanningId(null);
    }
  }

  async function handleDelete(userId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement cet utilisateur ? Cette action est irréversible.")) {
      return;
    }
    setDeletingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Erreur lors de la suppression");
        return;
      }

      toast.success("Utilisateur supprimé définitivement");
      router.refresh();
    } catch {
      toast.error("Erreur serveur");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {["Utilisateur", "Email", "Rôle", "Commandes", "Inscrit le", "Statut", "Actions"].map((h) => (
              <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-widest text-gray-500 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Aucun utilisateur trouvé</td>
            </tr>
          )}
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                      {u.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-1.5">
                        {u.name ?? "—"}
                        {isSelf && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-brand-100 text-brand-900 font-bold uppercase tracking-wider rounded-sm">
                            Vous
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 text-sm">{u.email}</td>
                <td className="px-4 py-3">
                  {u.role === "ADMIN" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-black text-white rounded-none border border-black uppercase tracking-wider text-[10px]">
                      <Shield className="w-3 h-3 text-soft-gold" /> Admin
                    </span>
                  )}
                  {u.role === "CONFIRMATRICE" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-800 rounded-none border border-blue-200 uppercase tracking-wider text-[10px]">
                      <Users className="w-3 h-3" /> Confirmatrice
                    </span>
                  )}
                  {u.role === "CUSTOMER" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-none border border-gray-200 uppercase tracking-wider text-[10px]">
                      <ShoppingBag className="w-3 h-3" /> Client
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary">{u._count.orders}</Badge>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {u.isBanned ? (
                    <Badge variant="destructive">Banni</Badge>
                  ) : (
                    <Badge variant="success">Actif</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* View details */}
                    <a
                      href={`/admin/customers/${u.id}`}
                      title="Voir les détails"
                      className="p-1.5 text-gray-400 hover:text-gray-900 transition-colors inline-flex border border-gray-100 bg-white hover:shadow-sm"
                    >
                      <Eye className="w-4 h-4" />
                    </a>

                    {/* Ban Toggle */}
                    {!isSelf && (
                      <button
                        onClick={() => handleToggleBan(u)}
                        disabled={banningId !== null}
                        title={u.isBanned ? "Débannir" : "Bannir"}
                        className={`p-1.5 transition-colors inline-flex border ${
                          u.isBanned
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                        }`}
                      >
                        {banningId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Ban className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Delete User */}
                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId !== null}
                        title="Supprimer définitivement"
                        className="p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors inline-flex"
                      >
                        {deletingId === u.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
