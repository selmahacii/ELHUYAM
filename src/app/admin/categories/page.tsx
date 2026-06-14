import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import CategoriesClient from "./categories-client";

export default async function AdminCategoriesPage() {
  const categories = await db.category.findMany({
    include: { _count: { select: { products: { where: { archived: false } } } } },
    orderBy: { sortOrder: "asc" },
  });
  return <CategoriesClient initialCategories={categories} />;
}
