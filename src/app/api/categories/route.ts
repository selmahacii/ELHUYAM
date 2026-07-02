import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { categorySchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { slugify } from "@/lib/utils";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const featured = req.nextUrl.searchParams.get("featured");
    const categories = await db.category.findMany({
      where: featured === "true" ? { featured: true } : undefined,
      include: { _count: { select: { products: { where: { archived: false } } } } },
      orderBy: { sortOrder: "asc" },
    });
    return successResponse(categories);
  } catch {
    return errorResponse("Failed to fetch categories.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const data = parsed.data;
    const slug = data.slug || slugify(data.name);

    const existing = await db.category.findUnique({ where: { slug } });
    if (existing) return errorResponse("Category with this name already exists.", 409);

    const category = await db.category.create({ data: { ...data, slug } });

    // Bulk create pending subcategories if provided
    const subcategories = body.subcategories;
    if (Array.isArray(subcategories) && subcategories.length > 0) {
      for (const sub of subcategories) {
        if (sub.name && sub.name.trim()) {
          const subSlug = slugify(sub.name);
          // Check if subcategory slug already exists, if so append unique timestamp
          const subExisting = await db.category.findUnique({ where: { slug: subSlug } });
          const finalSubSlug = subExisting ? `${subSlug}-${Date.now().toString().slice(-4)}` : subSlug;

          await db.category.create({
            data: {
              name: sub.name.trim(),
              slug: finalSubSlug,
              image: sub.image || null,
              parentId: category.id,
              featured: false,
              sortOrder: 0
            }
          });
        }
      }
    }

    return successResponse(category, 201);
  } catch {
    return errorResponse("Failed to create category.", 500);
  }
}
