import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { slugify } from "@/lib/utils";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

const categoryPatchSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  banner: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  parentId: z.string().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const category = await db.category.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: { _count: { select: { products: { where: { archived: false } } } } },
  });
  if (!category) return errorResponse("Category not found", 404);
  return successResponse(category);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const categoryToUpdate = await db.category.findUnique({ where: { id } });
    if (!categoryToUpdate) return errorResponse("Category not found", 404);

    const body = await req.json();
    const parsed = categoryPatchSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const data = parsed.data;
    if (categoryToUpdate.slug === "uncategorized" && data.slug && data.slug !== "uncategorized") {
      return errorResponse("Cannot change slug of Uncategorized category.", 400);
    }

    if (data.name && !data.slug) data.slug = slugify(data.name);

    // Convert empty string image to null so DB stores null not ""
    if (data.image === "") data.image = null;

    const category = await db.category.update({ where: { id }, data });
    return successResponse(category);
  } catch (err) {
    console.error("[CATEGORY PATCH]", err);
    return errorResponse("Failed to update category.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const category = await db.category.findUnique({ where: { id } });
    if (!category) return errorResponse("Category not found", 404);

    if (category.slug === "uncategorized") {
      return errorResponse("Cannot delete the default Uncategorized category.", 400);
    }

    // Find all subcategories
    const subCategories = await db.category.findMany({ where: { parentId: id } });
    const subCategoryIds = subCategories.map((c: any) => c.id);
    const allCategoryIds = [id, ...subCategoryIds];

    // Check if there are active products in any of these categories
    const hasProducts = await db.product.count({
      where: { categoryId: { in: allCategoryIds }, archived: false }
    });
    if (hasProducts > 0) {
      return errorResponse("Cannot delete category with active products.", 409);
    }

    // Check if there are any products to move (which will be archived products)
    const productsToMoveCount = await db.product.count({
      where: { categoryId: { in: allCategoryIds } }
    });

    if (productsToMoveCount > 0) {
      let uncategorized = await db.category.findUnique({ where: { slug: "uncategorized" } });
      if (!uncategorized) {
        uncategorized = await db.category.create({
          data: {
            name: "Uncategorized",
            slug: "uncategorized",
            description: "Default category for archived products",
            featured: false,
            sortOrder: 9999
          }
        });
      }

      await db.product.updateMany({
        where: { categoryId: { in: allCategoryIds } },
        data: { categoryId: uncategorized.id }
      });
    }

    // Delete subcategories first, then delete the category
    await db.category.deleteMany({ where: { parentId: id } });
    await db.category.delete({ where: { id } });

    return successResponse({ message: "Category deleted." });
  } catch (err) {
    console.error("[CATEGORY DELETE]", err);
    return errorResponse("Failed to delete category.", 500);
  }
}
