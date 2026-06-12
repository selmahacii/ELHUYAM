export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Search, 
  Filter, 
  X, 
  UserCheck, 
  UserX, 
  Users,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Mail,
  Calendar,
  ShoppingBag
} from "lucide-react";
import CreateUserModal from "./create-user-modal";

interface SearchParams { 
  searchParams: Promise<{ search?: string; page?: string; isBanned?: string; role?: string }> 
}

export default async function AdminCustomersPage({ searchParams }: SearchParams) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;
  const roleFilter = sp.role === "ADMIN" ? "ADMIN" : "CUSTOMER";

  const where = {
    role: roleFilter as "CUSTOMER" | "ADMIN",
    ...(sp.search ? {
      OR: [
        { name: { contains: sp.search } },
        { email: { contains: sp.search } },
      ],
    } : {}),
    ...(sp.isBanned === "true" ? { isBanned: true } : {}),
  };

  const [customers, total, stats] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true, 
        name: true, 
        email: true, 
        role: true,
        isBanned: true, 
        createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.user.count({ where }),
    Promise.all([
      db.user.count({ where: { role: roleFilter as "CUSTOMER" | "ADMIN" } }),
      db.user.count({ where: { role: roleFilter as "CUSTOMER" | "ADMIN", isBanned: false } }),
      db.user.count({ where: { role: roleFilter as "CUSTOMER" | "ADMIN", isBanned: true } }),
    ]),
  ]);

  const [totalCount, activeCount, bannedCount] = stats;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* ── Header Area ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="font-display text-2xl text-slate-900 font-bold tracking-tight">
            Gestion des Clients & Comptes
          </h1>
          <p className="text-slate-500 text-xs font-medium mt-1 leading-relaxed">
            Consultez les fiches clients, gérez leurs comptes et contrôlez les accès à votre boutique.
          </p>
        </div>
        <div className="shrink-0">
          <CreateUserModal defaultRoleOnly={true} />
        </div>
      </div>

      {/* ── Client Stats Dashboard Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Users */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Total {roleFilter === "ADMIN" ? "Administrateurs" : "Clients"}</p>
            <h3 className="text-xl font-bold text-slate-900">{totalCount}</h3>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Comptes Actifs</p>
            <h3 className="text-xl font-bold text-emerald-600">{activeCount}</h3>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Banned Users */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Comptes Bannis</p>
            <h3 className="text-xl font-bold text-rose-600">{bannedCount}</h3>
          </div>
          <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Filters Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <form method="GET" className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                name="search"
                defaultValue={sp.search}
                placeholder="Rechercher par nom ou email..."
                className="w-full border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10 font-medium"
              />
            </div>

            {/* Role Select Dropdown */}
            <select
              name="role"
              defaultValue={roleFilter}
              className="border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 transition-all h-10 cursor-pointer"
            >
              <option value="CUSTOMER">👥 Clients uniquement</option>
              <option value="ADMIN">🛡️ Administrateurs</option>
            </select>

            {/* Banned Toggle Checkbox */}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 border border-gray-200 rounded-2xl px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-all h-10 select-none bg-white">
              <input 
                type="checkbox" 
                name="isBanned" 
                value="true" 
                defaultChecked={sp.isBanned === "true"} 
                className="w-4 h-4 accent-slate-900 shrink-0 rounded-md" 
              />
              🚫 Bannis uniquement
            </label>
          </div>

          <div className="flex gap-2 shrink-0 self-end md:self-auto">
            <button 
              type="submit" 
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm transition-all h-10"
            >
              <Filter className="w-3.5 h-3.5" /> Filtrer
            </button>
            <Link 
              href="/admin/customers" 
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-600 rounded-xl transition-all h-10 bg-white shadow-sm"
            >
              <X className="w-3.5 h-3.5" /> Réinitialiser
            </Link>
          </div>
        </form>
      </div>

      {/* ── Table Container ───────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70">
                {["Client", "Email / Contact", "Rôle", "Commandes", "Date d'Inscription", "Statut", ""].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-slate-300">
                        <Users className="w-8 h-8" />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Aucun compte client trouvé.</p>
                    </div>
                  </td>
                </tr>
              )}
              {customers.map((c: (typeof customers)[number]) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                  
                  {/* Name & Avatar */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-brand-50 border border-brand-100/60 text-brand-900 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm uppercase">
                        {c.name?.[0] ?? "?"}
                      </div>
                      <div className="space-y-0.5">
                        <span className="block font-semibold text-slate-900 text-xs">{c.name ?? "Sans nom"}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">ID: {c.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Email */}
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {c.email}
                      </span>
                    </div>
                  </td>
                  
                  {/* Role */}
                  <td className="px-5 py-4">
                    {c.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase rounded-md bg-slate-900 text-white shadow-sm border border-slate-950">
                        <ShieldCheck className="w-3 h-3 text-soft-gold shrink-0" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase rounded-md bg-slate-50 border border-slate-200 text-slate-600">
                        Client
                      </span>
                    )}
                  </td>
                  
                  {/* Orders count */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {c._count.orders}
                    </span>
                  </td>
                  
                  {/* Subscription date */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {formatDate(c.createdAt)}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className="px-5 py-4">
                    {c.isBanned ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-rose-50 border border-rose-200 text-rose-800">
                        Banni
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Actif
                      </span>
                    )}
                  </td>
                  
                  {/* Action */}
                  <td className="px-5 py-4 text-right">
                    <Link 
                      href={`/admin/customers/${c.id}`} 
                      className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-colors inline-flex opacity-80 group-hover:opacity-100"
                      title="Consulter le profil complet"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-slate-500 font-medium">
              Page <span className="font-bold text-slate-900">{page}</span> sur <span className="font-bold text-slate-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-1">
              {/* Prev Button */}
              {page > 1 ? (
                <Link
                  href={`?page=${page - 1}&role=${roleFilter}${sp.search ? `&search=${sp.search}` : ""}`}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-white text-slate-600 flex items-center justify-center transition-all bg-slate-50 shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="w-8 h-8 rounded-lg border border-gray-100 text-slate-300 flex items-center justify-center opacity-40 bg-slate-50 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}

              {/* Number bubbles */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, page - 3), page + 2)
                .map((p) => (
                  <Link 
                    key={p} 
                    href={`?page=${p}&role=${roleFilter}${sp.search ? `&search=${sp.search}` : ""}`}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      p === page 
                        ? "bg-slate-900 text-white border border-slate-900" 
                        : "border border-gray-200 hover:bg-white text-slate-600 bg-slate-50/50"
                    }`}
                  >
                    {p}
                  </Link>
                ))}

              {/* Next Button */}
              {page < totalPages ? (
                <Link
                  href={`?page=${page + 1}&role=${roleFilter}${sp.search ? `&search=${sp.search}` : ""}`}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:bg-white text-slate-600 flex items-center justify-center transition-all bg-slate-50 shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="w-8 h-8 rounded-lg border border-gray-100 text-slate-300 flex items-center justify-center opacity-40 bg-slate-50 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
