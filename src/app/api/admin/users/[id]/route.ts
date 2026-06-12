import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { z } from "zod";
import bcrypt from "bcryptjs";

type Params = { params: Promise<{ id: string }> };

const updateUserSchema = z.object({
  isBanned: z.boolean().optional(),
  banReason: z.string().optional().nullable(),
  password: z.string().min(8).optional(),
});

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      include: {
        orders: { orderBy: { createdAt: "desc" }, take: 5, include: { items: true } },
        addresses: true,
        _count: { select: { orders: true, reviews: true, wishlistItems: true } },
      },
    });
    if (!user) return errorResponse("User not found", 404);
    return successResponse(user);
  } catch {
    return errorResponse("Failed to fetch user.", 500);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { isBanned, banReason, password } = parsed.data;

    const data: any = {};
    if (isBanned !== undefined) data.isBanned = isBanned;
    if (banReason !== undefined) data.banReason = banReason;
    if (password !== undefined) {
      data.password = await bcrypt.hash(password, 12);
    }

    const user = await db.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, isBanned: true },
    });
    return successResponse(user);
  } catch {
    return errorResponse("Failed to update user.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const { id } = await params;

    // Prevent self-deletion
    if (id === session.user.id) {
      return errorResponse("Vous ne pouvez pas supprimer votre propre compte.", 400);
    }

    await db.user.delete({ where: { id } });
    return successResponse({ message: "Utilisateur supprimé avec succès." });
  } catch (err) {
    console.error("Failed to delete user:", err);
    return errorResponse("Impossible de supprimer l'utilisateur.", 500);
  }
}
