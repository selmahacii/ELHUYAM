import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { couponSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = couponSchema.partial().safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const coupon = await db.coupon.update({ where: { id }, data: parsed.data });
    return successResponse(coupon);
  } catch {
    return errorResponse("Failed to update coupon.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    await db.coupon.delete({ where: { id } });
    return successResponse({ message: "Coupon deleted." });
  } catch {
    return errorResponse("Failed to delete coupon.", 500);
  }
}
