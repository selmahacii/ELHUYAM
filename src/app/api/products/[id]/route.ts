import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { slugify } from "@/lib/utils";
import { auth } from "@/auth";
import { revalidateTag, revalidatePath } from "next/cache";
import { deleteMultipleMedia } from "@/lib/cloudinary-server";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().min(10).optional(),
  price: z.coerce.number().positive().optional(),
  discountPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  priceEur: z.coerce.number().min(0).optional(),
  discountPriceEur: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().positive().nullable().optional()
  ),
  costPrice: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0, "Cost price must be non-negative").nullable().optional()
  ),
  stock: z.coerce.number().int().min(0).optional(),
  weight: z.coerce.number().min(0.01).max(100).optional(),
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

    // Fetch existing product to know current slug & variants
    const currentProduct = await db.product.findUnique({
      where: { id },
      include: { variants: true },
    });

    if (!currentProduct) return errorResponse("Product not found", 404);

    // If stock is updated explicitly and product has a single variant, keep variant stock in sync
    if (data.stock !== undefined && currentProduct.variants.length === 1) {
      await db.productVariant.update({
        where: { id: currentProduct.variants[0].id },
        data: { stock: data.stock },
      });
    }

    const product = await db.product.update({
      where: { id },
      data,
      include: { category: true, variants: true },
    });

    // Invalidate caches immediately so changes reflect on storefront in real-time
    try {
      revalidateTag("products", "default");
      revalidateTag("categories", "default");
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
      revalidatePath("/categories", "page");
      if (product.slug) {
        revalidatePath(`/shop/${product.slug}`, "page");
      }
      if (currentProduct.slug && currentProduct.slug !== product.slug) {
        revalidatePath(`/shop/${currentProduct.slug}`, "page");
      }
      revalidatePath("/admin/products");
    } catch (e) {
      console.warn("[PRODUCT_PATCH] Revalidation notice:", e);
    }

    return successResponse(product);
  } catch (error) {
    console.error("[PRODUCT_PATCH_ERROR]", error);
    return errorResponse("Failed to update product.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;

    // 1. Fetch product with all relations to retrieve all images and videos
    const product = await db.product.findUnique({
      where: { id },
      include: {
        variants: true,
        reviews: true,
      },
    });

    if (!product) {
      return errorResponse("Produit introuvable", 404);
    }

    // 2. Collect all media files to delete from Cloudinary / local storage
    const mediaToDelete: string[] = [];

    // Main product images
    if (Array.isArray(product.images)) {
      for (const img of product.images) {
        if (typeof img === "string" && img.trim()) mediaToDelete.push(img.trim());
      }
    }

    // Product videos
    if (Array.isArray(product.videos)) {
      for (const vid of product.videos) {
        if (typeof vid === "string" && vid.trim()) mediaToDelete.push(vid.trim());
      }
    }

    // Variant images
    for (const variant of product.variants) {
      if (variant.image && typeof variant.image === "string" && variant.image.trim()) {
        mediaToDelete.push(variant.image.trim());
      }
    }

    // 3. Delete media assets asynchronously
    if (mediaToDelete.length > 0) {
      deleteMultipleMedia(mediaToDelete).catch((err) =>
        console.warn("[PRODUCT_DELETE] Error deleting media from Cloudinary:", err)
      );
    }

    // 4. Cascade delete all DB relations in a single clean transaction
    await db.$transaction([
      db.cartItem.deleteMany({ where: { productId: id } }),
      db.wishlistItem.deleteMany({ where: { productId: id } }),
      db.review.deleteMany({ where: { productId: id } }),
      db.productVariant.deleteMany({ where: { productId: id } }),
      db.orderItem.deleteMany({ where: { productId: id } }),
      db.product.delete({ where: { id } }),
    ]);

    // 5. Invalidate caches immediately
    try {
      revalidateTag("products", "default");
      revalidateTag("categories", "default");
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
      revalidatePath("/categories", "page");
      if (product.slug) {
        revalidatePath(`/shop/${product.slug}`, "page");
      }
    } catch (e) {
      console.warn("[PRODUCT_DELETE] Revalidation notice:", e);
    }

    return successResponse({
      message: "Produit, photos Cloudinary et toutes les données associées supprimés définitivement.",
    });
  } catch (error) {
    console.error("[PRODUCT_DELETE_ERROR]", error);
    return errorResponse("Échec de la suppression définitive du produit.", 500);
  }
}
