import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const { orderNumber, phone } = await req.json();

    if (!orderNumber) {
      return errorResponse("Order or tracking number is required", 400);
    }

    const trimmedOrder = orderNumber.trim();

    // Find the order
    const order = await db.order.findFirst({
      where: {
        OR: [
          { orderNumber: trimmedOrder },
          { trackingNumber: trimmedOrder }
        ]
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                slug: true,
                images: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: "asc"
          }
        },
      }
    });

    if (!order) {
      return errorResponse("Order not found", 444);
    }

    // Security Verification:
    // 1. Check if it matches the "last_placed_order" cookie in browser
    const cookieOrder = req.cookies.get("last_placed_order")?.value;
    const cookieMatches = cookieOrder === order.orderNumber;

    // 2. Check if phone number is provided and matches shippingPhone
    // (strip everything but digits — older orders can have invisible Unicode
    // bidi control chars from RTL keyboards embedded around the number)
    const cleanOrderPhone = order.shippingPhone?.replace(/\D/g, "") || "";
    const cleanInputPhone = phone?.replace(/\D/g, "") || "";

    const phoneMatches =
      cleanInputPhone.length >= 8 &&
      (cleanOrderPhone.endsWith(cleanInputPhone) || cleanInputPhone.endsWith(cleanOrderPhone));

    if (!cookieMatches && !phoneMatches) {
      return errorResponse("Verification failed. Please check the order details.", 403);
    }

    return successResponse(order);
  } catch (err) {
    console.error("[orders/track/POST]", err);
    return errorResponse("Failed to retrieve tracking details", 500);
  }
}
