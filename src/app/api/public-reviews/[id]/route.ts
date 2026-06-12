import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const moderateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "CONFIRMATRICE")
      return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const body = await req.json();
    const parsed = moderateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const review = await db.publicReview.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return successResponse(review);
  } catch {
    return errorResponse("Failed to moderate review.", 500);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN" && session?.user?.role !== "CONFIRMATRICE")
      return errorResponse("Unauthorized", 401);

    const { id } = await params;
    await db.publicReview.delete({ where: { id } });

    return successResponse({ message: "Review deleted." });
  } catch {
    return errorResponse("Failed to delete review.", 500);
  }
}
