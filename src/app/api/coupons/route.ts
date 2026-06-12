import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { couponSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });
    return successResponse(coupons);
  } catch {
    return errorResponse("Failed to fetch coupons.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = couponSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const existing = await db.coupon.findUnique({ where: { code: parsed.data.code } });
    if (existing) return errorResponse("Coupon code already exists.", 409);

    const coupon = await db.coupon.create({ data: parsed.data });
    return successResponse(coupon, 201);
  } catch {
    return errorResponse("Failed to create coupon.", 500);
  }
}
