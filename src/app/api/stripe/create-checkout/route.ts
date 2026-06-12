import { NextRequest } from "next/server";
import { createCheckoutSession } from "@/lib/stripe";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) return errorResponse("Unauthorized", 401);

    const { orderId } = await req.json();
    if (!orderId) return errorResponse("orderId is required");

    const order = await db.order.findUnique({
      where: { id: orderId, userId: session.user.id },
      include: { items: true },
    });
    if (!order) return errorResponse("Order not found", 404);

    const lineItems = order.items.map((item: (typeof order.items)[number]) => ({
      price_data: {
        currency: "dzd",
        product_data: { name: item.productTitle },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const checkoutSession = await createCheckoutSession(lineItems, orderId, session.user.email);
    return successResponse({ url: checkoutSession.url });
  } catch {
    return errorResponse("Failed to create checkout session.", 500);
  }
}
