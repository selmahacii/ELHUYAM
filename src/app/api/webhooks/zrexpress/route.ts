import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { updateOrderAdmin } from "@/lib/orders";

// ZR Express state → our OrderStatus mapping
const ZR_STATE_MAP: Record<string, string> = {
  "en attente":          "PENDING",
  "confirmé":            "CONFIRMED",
  "récupéré":            "PROCESSING",
  "en transit":          "SHIPPED",
  "sorti en livraison":  "OUT_FOR_DELIVERY",
  "livré":               "DELIVERED",
  "retourné":            "REFUNDED",
  "annulé":              "CANCELLED",
  // English variants
  "pending":             "PENDING",
  "confirmed":           "CONFIRMED",
  "picked up":           "PROCESSING",
  "in transit":          "SHIPPED",
  "out for delivery":    "OUT_FOR_DELIVERY",
  "delivered":           "DELIVERED",
  "returned":            "REFUNDED",
  "cancelled":           "CANCELLED",
};

function mapZRState(stateName: string): string | null {
  return ZR_STATE_MAP[stateName.toLowerCase()] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Svix dispatches events wrapped in a 'data' object. Fallback to raw body if not present.
    const payload = body.data ?? body;

    const trackingNumber: string | undefined = payload.trackingNumber ?? payload.tracking_number;
    const stateName: string | undefined = payload.stateName ?? payload.state_name ?? payload.status;
    const parcelId: string | undefined = payload.id ?? payload.parcelId;

    // Return 200 OK for test pings or empty payloads from Svix/ZR Express
    if (!trackingNumber) {
      console.log("[ZR Express Webhook] Received test ping or payload without tracking number.");
      return successResponse({ message: "Ping received successfully" });
    }

    // Find the matching order
    const order = await db.order.findFirst({
      where: {
        OR: [
          { trackingNumber },
          ...(parcelId ? [{ zrParcelId: parcelId }] : []),
        ],
      },
    });

    if (!order) return successResponse({ message: "Order not found — ignored" });

    // Map ZR state to our status
    const newStatus = stateName ? mapZRState(stateName) : null;

    if (newStatus && newStatus !== order.status) {
      await updateOrderAdmin(order.id, {
        status: newStatus,
        note: `ZR Express: ${stateName}`
      });
    }

    return successResponse({ received: true });
  } catch {
    return errorResponse("Webhook processing failed", 500);
  }
}
