import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";

// Backing data for the "manual order" modal (product/category pickers).
// Previously fetched server-side on every /admin/orders page load — moved
// behind an endpoint the modal calls only when it's actually opened, so
// browsing/paginating the orders list no longer pays for the full in-stock
// catalog fetch every time.
export async function GET() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "ADMIN" && role !== "CONFIRMATRICE") {
    return errorResponse("Unauthorized", 401);
  }

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where: { archived: false, stock: { gt: 0 } },
      select: {
        id: true,
        title: true,
        price: true,
        discountPrice: true,
        stock: true,
        images: true,
        categoryId: true,
        variants: {
          select: { id: true, size: true, color: true, colorHex: true, image: true, stock: true, price: true },
        },
      },
      orderBy: { title: "asc" },
    }),
    db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return successResponse({ products, categories });
}
