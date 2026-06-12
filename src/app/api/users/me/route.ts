import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { updateProfileSchema, changePasswordSchema } from "@/lib/validations";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, image: true, phone: true,
        role: true, createdAt: true,
        addresses: { orderBy: { isDefault: "desc" } },
        _count: { select: { orders: true, reviews: true, wishlistItems: true } },
      },
    });

    if (!user) return errorResponse("User not found", 404);
    return successResponse(user);
  } catch {
    return errorResponse("Failed to fetch profile.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const user = await db.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, image: true, phone: true },
    });

    return successResponse(user);
  } catch {
    return errorResponse("Failed to update profile.", 500);
  }
}

export async function PUT(req: NextRequest) {
  // Change password
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const user = await db.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) return errorResponse("Cannot change password for OAuth accounts.", 400);

    const valid = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!valid) return errorResponse("Current password is incorrect.", 400);

    const hashed = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.user.update({ where: { id: user.id }, data: { password: hashed } });

    return successResponse({ message: "Password changed successfully." });
  } catch {
    return errorResponse("Failed to change password.", 500);
  }
}
