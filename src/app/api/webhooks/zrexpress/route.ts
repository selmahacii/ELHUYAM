import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { updateOrderAdmin } from "@/lib/orders";
import { sendOrderShippedEmail } from "@/lib/email";

// ZR Express state → our OrderStatus mapping
const ZR_STATE_MAP: Record<string, string> = {
  // French variants from ZR Express dashboard
  "prêt à expédier":     "CONFIRMED",
  "prêt a expédier":     "CONFIRMED",
  "pret a expedier":     "CONFIRMED",
  "commande reçue":      "CONFIRMED",
  "commande recue":      "CONFIRMED",
  "au bureau":           "PROCESSING",
  "confirmée au bureau": "PROCESSING",
  "confirmee au bureau": "PROCESSING",
  "confirmé au bureau":  "PROCESSING",
  "confirme au bureau":  "PROCESSING",
  "dispatch":            "PROCESSING",
  "vers wilaya":         "SHIPPED",
  "en livraison":        "OUT_FOR_DELIVERY",
  "sortie en livraison": "OUT_FOR_DELIVERY",
  "livré":               "DELIVERED",
  "livre":               "DELIVERED",
  "encaissé":            "DELIVERED",
  "encaisse":            "DELIVERED",
  "recouvert":           "DELIVERED",
  "retourné":            "REFUNDED",
  "retourne":            "REFUNDED",
  "annulé":              "CANCELLED",
  "annule":              "CANCELLED",
  "échoué":              "CANCELLED",
  "echoue":              "CANCELLED",
  "en attente":          "PENDING",
  "confirmé":            "CONFIRMED",
  "confirme":            "CONFIRMED",
  "récupéré":            "PROCESSING",
  "recupere":            "PROCESSING",
  "en transit":          "SHIPPED",

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
      const updatedOrder = await updateOrderAdmin(order.id, {
        status: newStatus,
        note: `ZR Express: ${stateName}`
      });

      // Send email if order status changed to SHIPPED
      if (newStatus === "SHIPPED") {
        const userEmail = updatedOrder.user?.email || order.user?.email;
        const trackingToUse = updatedOrder.trackingNumber || order.trackingNumber;

        if (userEmail && trackingToUse) {
          const customerName = `${updatedOrder.shippingFirstName ?? ""} ${updatedOrder.shippingLastName ?? ""}`.trim() || updatedOrder.user?.name || "Customer";
          sendOrderShippedEmail(
            userEmail,
            customerName,
            updatedOrder.orderNumber,
            trackingToUse,
            updatedOrder.totalAmount,
            updatedOrder.isInternational,
            updatedOrder.items.map((i: any) => ({
              productTitle: i.productTitle,
              quantity: i.quantity,
              price: i.price,
            }))
          ).catch((err) => console.error("[email/shipped/webhook]", err));
        }
      }
    }

    return successResponse({ received: true });
  } catch {
    return errorResponse("Webhook processing failed", 500);
  }
}
