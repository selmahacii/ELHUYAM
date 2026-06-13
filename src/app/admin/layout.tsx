import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { NavProgress } from "@/components/admin/nav-progress";
import { AdminQueryProvider } from "@/providers/admin-query-provider";
import { PageTransition } from "@/components/admin/page-transition";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;
  if (!session || (role !== "ADMIN" && role !== "CONFIRMATRICE")) {
    redirect("/auth/login?callbackUrl=/admin");
  }

  const [pendingOrdersCount, lowStockProductsRaw, lowStockVariantsRaw] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "Product" P
      WHERE P.archived = false
      AND P.stock <= P."lowStockThreshold"
      AND NOT EXISTS (SELECT 1 FROM "ProductVariant" V WHERE V."productId" = P.id)
    `,
    db.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM "ProductVariant" V
      INNER JOIN "Product" P ON V."productId" = P.id
      WHERE P.archived = false
      AND V.stock <= P."lowStockThreshold"
    `,

  ]);
  const lowStockProductsCount = Number(lowStockProductsRaw[0]?.count ?? 0);
  const lowStockVariantsCount = Number(lowStockVariantsRaw[0]?.count ?? 0);
  const lowStockCount = lowStockProductsCount + lowStockVariantsCount;

  return (
    <AdminQueryProvider>
      <div className="flex h-screen bg-[#f9f8f6] font-body flex-col lg:flex-row overflow-hidden">
        {/* Progress bar — must be in Suspense because it uses useSearchParams */}
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>

        <AdminSidebar
          user={session.user}
          pendingOrders={pendingOrdersCount}
          lowStockCount={lowStockCount}
          role={role}
        />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4 lg:p-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </AdminQueryProvider>
  );
}
