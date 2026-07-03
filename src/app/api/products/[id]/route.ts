import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { slugify } from "@/lib/utils";
import { auth } from "@/auth";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().positive().optional(),
  discountPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  priceEur: z.coerce.number().positive().optional(),
  discountPriceEur: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  costPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0, "Cost price must be non-negative").nullable().optional()
  ),
  stock: z.coerce.number().int().min(0).optional(),
  sku: z.string().nullable().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).max(10_000).optional(),
  categoryId: z.string().min(1).optional(),
  images: z.array(z.string()).optional(),
  videos: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  bestseller: z.boolean().optional(),
  newArrival: z.boolean().optional(),
  archived: z.boolean().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const product = await db.product.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        category: true,
        variants: true,
        reviews: {
          where: { status: "APPROVED" },
          include: { user: { select: { name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!product) return errorResponse("Product not found", 404);
    return successResponse(product);
  } catch {
    return errorResponse("Failed to fetch product.", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const data = parsed.data;
    if (data.title && !data.slug) data.slug = slugify(data.title);

    const product = await db.product.update({
      where: { id },
      data,
      include: { category: true },
    });

    return successResponse(product);
  } catch {
    return errorResponse("Failed to update product.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    
    // Vérifier si le produit est lié à des commandes existantes
    const orderItemsCount = await db.orderItem.count({ where: { productId: id } });
    
    if (orderItemsCount > 0) {
      // Soft-delete (archivage) pour préserver l'historique des commandes
      await db.product.update({ where: { id }, data: { archived: true } });
      return successResponse({ message: "Produit lié à des commandes : archivé avec succès." });
    }

    // Hard-delete s'il n'a jamais été commandé
    await db.product.delete({ where: { id } });
    return successResponse({ message: "Produit supprimé définitivement." });
  } catch (error) {
    console.error("[PRODUCT_DELETE_ERROR]", error);
    return errorResponse("Échec de la suppression ou de l'archivage du produit.", 500);
  }
}
