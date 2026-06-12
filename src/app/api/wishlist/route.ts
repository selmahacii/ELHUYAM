import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

async function verifySession(actionName: string) {
  const session = await auth();
  if (!session) {
    console.warn(`[Wishlist API] ${actionName} failed: No session found (auth() returned null).`);
    return null;
  }
  if (!session.user?.id) {
    console.warn(`[Wishlist API] ${actionName} failed: Session exists but user.id is missing.`, session);
    return null;
  }

  const userExists = await db.user.findUnique({ where: { id: session.user.id } });
  if (!userExists) {
    console.warn(`[Wishlist API] ${actionName} failed: User ID "${session.user.id}" from session does not exist in the database.`);
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await verifySession("GET");
    if (!session) return errorResponse("Unauthorized", 401);

    const items = await db.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: {
            id: true, title: true, slug: true, price: true,
            discountPrice: true, images: true, stock: true, avgRating: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(items);
  } catch {
    return errorResponse("Failed to fetch wishlist.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await verifySession("POST");
    if (!session) return errorResponse("Unauthorized", 401);

    const { productId } = await req.json();
    if (!productId) return errorResponse("productId is required");

    const existing = await db.wishlistItem.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    });

    if (existing) {
      await db.wishlistItem.delete({ where: { id: existing.id } });
      return successResponse({ action: "removed" });
    }

    const item = await db.wishlistItem.create({
      data: { userId: session.user.id, productId },
      include: { product: { select: { title: true, images: true } } },
    });

    return successResponse({ action: "added", item }, 201);
  } catch {
    return errorResponse("Failed to update wishlist.", 500);
  }
}
