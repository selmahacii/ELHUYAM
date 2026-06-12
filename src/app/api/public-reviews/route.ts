import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse, getPaginationParams, paginatedResponse } from "@/lib/api-response";
import { z } from "zod";
import { auth } from "@/auth";

const publicReviewSchema = z.object({
  name: z.string().max(100).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().min(5, "L'avis doit contenir au moins 5 caractères").max(1000),
});

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(sp);

    const [reviews, total] = await Promise.all([
      db.publicReview.findMany({
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.publicReview.count({ where: { status: "APPROVED" } }),
    ]);

    return paginatedResponse(reviews, total, page, limit);
  } catch {
    return errorResponse("Impossible de récupérer les avis.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = publicReviewSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const { name, rating, comment } = parsed.data;

    const review = await db.publicReview.create({
      data: {
        name: name?.trim() || null,
        rating,
        comment: comment.trim(),
        status: "PENDING",
      },
    });

    return successResponse(review, 201);
  } catch {
    return errorResponse("Impossible de soumettre l'avis.", 500);
  }
}
