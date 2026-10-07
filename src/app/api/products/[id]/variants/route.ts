import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { productVariantSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { revalidateTag, revalidatePath } from "next/cache";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const variants = await db.productVariant.findMany({ where: { productId: id } });
  return successResponse(variants);
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();

    // Support bulk creation (array) or single
    const items = Array.isArray(body) ? body : [body];
    const parsed = items.map((item) => productVariantSchema.safeParse(item));
    const errors = parsed.filter((r) => !r.success);
    if (errors.length > 0) return errorResponse("Invalid variant data");

    const validVariants = parsed.map((r) => ({ ...r.data!, productId: id }));
    const totalVariantStock = validVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

    // Replace all variants for this product and sync aggregate stock in Product table
    await db.$transaction([
      db.productVariant.deleteMany({ where: { productId: id } }),
      db.productVariant.createMany({ data: validVariants }),
      db.product.update({
        where: { id },
        data: { stock: totalVariantStock },
      }),
    ]);

    const product = await db.product.findUnique({
      where: { id },
      select: { slug: true },
    });

    // Invalidate caches immediately so changes reflect on storefront in real-time
    try {
      revalidateTag("products", "default");
      revalidateTag("categories", "default");
      revalidatePath("/", "page");
      revalidatePath("/shop", "page");
      revalidatePath("/categories", "page");
      if (product?.slug) {
        revalidatePath(`/shop/${product.slug}`, "page");
      }
      revalidatePath("/admin/products");
    } catch (e) {
      console.warn("[VARIANTS_POST] Revalidation notice:", e);
    }

    return successResponse({ count: validVariants.length, totalStock: totalVariantStock }, 201);
  } catch (error) {
    console.error("[VARIANTS_POST_ERROR]", error);
    return errorResponse("Failed to save variants.", 500);
  }
}
