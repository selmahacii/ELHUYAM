import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { productVariantSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

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

    // Replace all variants for this product
    await db.productVariant.deleteMany({ where: { productId: id } });
    const variants = await db.productVariant.createMany({
      data: parsed.map((r) => ({ ...r.data!, productId: id })),
    });

    return successResponse(variants, 201);
  } catch {
    return errorResponse("Failed to save variants.", 500);
  }
}
