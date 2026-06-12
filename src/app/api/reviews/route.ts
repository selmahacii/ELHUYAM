import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validations";
import { successResponse, errorResponse, getPaginationParams, paginatedResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(sp);
    const productId = sp.get("productId");
    const status = sp.get("status");
    const session = await auth();
    const isAdmin = session?.user?.role === "ADMIN";

    const where = {
      ...(productId ? { productId } : {}),
      // Non-admins only see approved reviews
      ...(!isAdmin ? { status: "APPROVED" as const } : status ? { status: status as never } : {}),
    };

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: { user: { select: { name: true, image: true } }, product: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
    ]);

    return paginatedResponse(reviews, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch reviews.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { productId, rating, title, comment, name } = parsed.data;

    let userId: string | null = null;
    let verified = false;
    let reviewerName: string | null = name || null;

    if (session?.user?.id) {
      const userExists = await db.user.findUnique({ where: { id: session.user.id } });
      if (userExists) {
        userId = session.user.id;
        // Use findFirst instead of findUnique because the compound unique constraint was removed
        const existing = await db.review.findFirst({
          where: { userId, productId },
        });
        if (existing) return errorResponse("You have already reviewed this product.", 409);

        // Verify purchase
        const hasPurchased = await db.orderItem.findFirst({
          where: {
            productId,
            order: { userId, status: "DELIVERED" },
          },
        });
        verified = !!hasPurchased;
        reviewerName = name || session.user.name || null;
      } else {
        userId = null;
        reviewerName = name || null;
      }
    }

    const review = await db.review.create({
      data: {
        userId,
        productId,
        rating,
        title: title ?? null,
        comment: comment ?? null,
        name: reviewerName,
        verified,
        status: "PENDING",
      },
      include: { user: { select: { name: true, image: true } } },
    });

    return successResponse(review, 201);
  } catch (error) {
    console.error("Reviews API POST Error:", error);
    return errorResponse("Failed to submit review.", 500);
  }
}
