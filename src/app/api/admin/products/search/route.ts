import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "CONFIRMATRICE") {
    return errorResponse("Unauthorized", 401);
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(20, parseInt(req.nextUrl.searchParams.get("limit") ?? "8"));

  if (q.length < 2) return successResponse([]);

  const products = await db.product.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { sku: { contains: q } },
      ],
      archived: false,
      stock: { gt: 0 },
    },
    select: { id: true, title: true, price: true, discountPrice: true, stock: true, images: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return successResponse(products);
}
