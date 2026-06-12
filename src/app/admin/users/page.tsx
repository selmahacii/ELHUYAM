import { db } from "@/lib/db";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CreateUserModal from "../customers/create-user-modal";
import { UsersTable } from "./users-table";

interface SearchParams {
  searchParams: Promise<{
    search?: string;
    page?: string;
    isBanned?: string;
    role?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: SearchParams) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    redirect("/admin");
  }

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  // Multi-role filter parsing
  const roleFilter = sp.role === "ADMIN" 
    ? "ADMIN" 
    : sp.role === "CONFIRMATRICE" 
    ? "CONFIRMATRICE" 
    : sp.role === "CUSTOMER" 
    ? "CUSTOMER" 
    : undefined;

  const where = {
    ...(roleFilter ? { role: roleFilter } : {}),
    ...(sp.search
      ? {
          OR: [
            { name: { contains: sp.search } },
            { email: { contains: sp.search } },
          ],
        }
      : {}),
    ...(sp.isBanned === "true" ? { isBanned: true } : {}),
  };

  const [users, total] = await Promise.all([
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
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-gray-900 font-bold uppercase tracking-wider">Utilisateurs & Équipe</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {total} utilisateur{total !== 1 ? "s" : ""} enregistré{total !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateUserModal />
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-2 bg-white p-4 border border-gray-200">
        <input
          name="search"
          defaultValue={sp.search}
          placeholder="Rechercher nom ou email..."
          className="border border-gray-200 px-3 py-2 text-sm w-64 focus:outline-none focus:border-gray-700 bg-white rounded-none"
        />
        <select
          name="role"
          defaultValue={sp.role ?? ""}
          className="border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:border-gray-700 text-gray-700 rounded-none"
        >
          <option value="">Tous les rôles</option>
          <option value="ADMIN">Administrateurs</option>
          <option value="CONFIRMATRICE">Confirmatrices</option>
          <option value="CUSTOMER">Clients uniquement</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 border border-gray-200 px-3 py-2 cursor-pointer hover:border-gray-400 transition-colors bg-white rounded-none">
          <input
            type="checkbox"
            name="isBanned"
            value="true"
            defaultChecked={sp.isBanned === "true"}
            className="accent-gray-900"
          />
          Bannis uniquement
        </label>
        <button
          type="submit"
          className="bg-gray-900 text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-gray-700 transition-colors rounded-none font-semibold"
        >
          Filtrer
        </button>
        <Link
          href="/admin/users"
          className="px-6 py-2 border border-gray-200 text-xs uppercase tracking-widest text-gray-600 hover:border-gray-700 transition-colors rounded-none flex items-center justify-center font-semibold"
        >
          Effacer
        </Link>
      </form>

      {/* Interactive Table Component */}
      <UsersTable users={users} currentUserId={session.user.id} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border border-gray-200 bg-white">
          <p className="text-xs text-gray-400">Page {page} sur {totalPages}</p>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, page - 3), page + 2)
              .map((p) => (
                <Link
                  key={p}
                  href={`?page=${p}${sp.role ? `&role=${sp.role}` : ""}${sp.search ? `&search=${sp.search}` : ""}${sp.isBanned ? `&isBanned=${sp.isBanned}` : ""}`}
                  className={`w-8 h-8 flex items-center justify-center text-xs border transition-colors ${
                    p === page
                      ? "bg-gray-900 text-white border-gray-900"
                      : "border-gray-200 text-gray-600 hover:border-gray-600"
                  }`}
                >
                  {p}
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
