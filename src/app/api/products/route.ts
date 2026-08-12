import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { productSchema } from "@/lib/validations";
import { successResponse, errorResponse, paginatedResponse, getPaginationParams } from "@/lib/api-response";
import { slugify } from "@/lib/utils";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = getPaginationParams(sp);

    const category = sp.get("category");
    const search = sp.get("search");
    const featured = sp.get("featured");
    const bestseller = sp.get("bestseller");
    const newArrival = sp.get("newArrival");
    const minPrice = sp.get("minPrice");
    const maxPrice = sp.get("maxPrice");
    const sortBy = sp.get("sortBy") ?? "createdAt";
    const sortOrder = sp.get("sortOrder") === "asc" ? "asc" : "desc";
    const tags = sp.get("tags")?.split(",").filter(Boolean);

    const where: any = {
      archived: false,
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { title: { contains: search } },
          { description: { contains: search } },
        ],
      }),
      ...(featured === "true" && { featured: true }),
      ...(bestseller === "true" && { bestseller: true }),
      ...(newArrival === "true" && { newArrival: true }),
      ...(minPrice || maxPrice
        ? {
            price: {
              ...(minPrice ? { gte: Number(minPrice) } : {}),
              ...(maxPrice ? { lte: Number(maxPrice) } : {}),
            },
          }
        : {}),
      ...(tags?.length ? {
        OR: tags.map((tag) => ({ title: { contains: tag } })),
      } : {}),
    };

    const orderBy: any =
      sortBy === "price"
        ? { price: sortOrder }
        : sortBy === "rating"
        ? { avgRating: sortOrder }
        : { createdAt: sortOrder };

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: { select: { name: true, slug: true } } },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return paginatedResponse(products, total, page, limit, {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    });
  } catch {
    return errorResponse("Failed to fetch products.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") return errorResponse("Unauthorized", 401);

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);

    const data = parsed.data;
    const slug = data.slug || slugify(data.title);

    const existing = await db.product.findUnique({ where: { slug } });
    if (existing) return errorResponse("A product with this slug already exists.", 409);

    const product = await db.product.create({
      data: {
        ...data,
        slug,
        discountPrice: data.discountPrice ?? null,
        costPrice: data.costPrice ?? null,
        sku: data.sku ?? null,
        metaTitle: data.metaTitle ?? null,
        metaDescription: data.metaDescription ?? null,
        videos: data.videos ?? [],
        tags: data.tags ?? [],
      },
      include: { category: true },
    });

    return successResponse(product, 201);
  } catch {
    return errorResponse("Failed to create product.", 500);
  }
}
