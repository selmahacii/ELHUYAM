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
  const limit = Math.min(30, parseInt(req.nextUrl.searchParams.get("limit") ?? "10"));

  const whereClause: any = { archived: false };
  if (q.length >= 2) {
    whereClause.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }

  const products = await db.product.findMany({
    where: whereClause,
    select: {
      id: true,
      title: true,
      price: true,
      discountPrice: true,
      priceEur: true,
      discountPriceEur: true,
      stock: true,
      images: true,
      variants: {
        select: {
          id: true,
          size: true,
          color: true,
          colorHex: true,
          stock: true,
          price: true,
          priceEur: true,
        },
      },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  return successResponse(products);
}
