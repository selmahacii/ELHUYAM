import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import ScrollToTop from "@/components/layout/scroll-to-top";
import { PageTransition } from "@/components/admin/page-transition";
import { db, withDbRetry } from "@/lib/db";
import { unstable_cache } from "next/cache";

const getNavbarCategories = unstable_cache(
  async () => {
    return withDbRetry(async () => {
      return db.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
        },
        orderBy: { sortOrder: "asc" },
      });
    });
  },
  ["navbar-categories-v1"],
  { revalidate: 86400, tags: ["categories"] }
);

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  const categories = await getNavbarCategories();

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Navbar initialCategories={categories} />
      <main className="flex-1 pt-[84px] min-h-[calc(100vh-84px)]">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
    </div>
  );
}
