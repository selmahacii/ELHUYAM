import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";

// ZR Express state → our OrderStatus mapping
const ZR_STATE_MAP: Record<string, string> = {
  "en attente":          "PENDING",
  "confirmé":            "CONFIRMED",
  "récupéré":            "PROCESSING",
  "en transit":          "SHIPPED",
  "sorti en livraison":  "OUT_FOR_DELIVERY",
  "livré":               "DELIVERED",
  "retourné":            "REFUNDED",
  "retourné au hub":     "REFUNDED",
  "annulé":              "CANCELLED",
  // English variants
  "pending":             "PENDING",
  "confirmed":           "CONFIRMED",
  "picked up":           "PROCESSING",
  "in transit":          "SHIPPED",
  "out for delivery":    "OUT_FOR_DELIVERY",
  "delivered":           "DELIVERED",
  "returned":            "REFUNDED",
  "returned to hub":     "REFUNDED",
  "cancelled":           "CANCELLED",
  "deleted":             "CANCELLED",
  "supprimé":            "CANCELLED",
  "supprime":            "CANCELLED",
};

function mapZRState(stateName: string): string | null {
  return ZR_STATE_MAP[stateName.toLowerCase()] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Détermine si les données sont enveloppées dans un objet "data" (format Svix/ZR Express)
    const payload = body.data || body;

    const trackingNumber: string | undefined = payload.trackingNumber ?? payload.tracking_number;
    
    const stateName: string | undefined = 
      (payload.state && typeof payload.state === "object" ? payload.state.name : null) ?? 
      payload.stateName ?? 
      payload.state_name ?? 
      payload.status;

    const parcelId: string | undefined = payload.id ?? payload.parcelId;
    const eventType: string | undefined = body.eventType ?? body.type ?? payload.eventType ?? payload.type;

    if (!trackingNumber) {
      // Retourne un statut 200 OK pour les requêtes de test/ping afin que la validation réussisse
      return successResponse({ message: "Test/Ping webhook received successfully" });
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
    let newStatus = stateName ? mapZRState(stateName) : null;
    let noteText = `ZR Express: ${stateName || eventType}`;

    if (eventType === "parcel.deleted" || eventType === "parcel.cancelled") {
      newStatus = "CANCELLED";
      noteText = `ZR Express: Colis supprimé/annulé (Event: ${eventType})`;
    }

    if (newStatus && newStatus !== order.status) {
      await db.$transaction([
        db.order.update({
          where: { id: order.id },
          data: { status: newStatus as never },
        }),
        db.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: newStatus as never,
            note: noteText,
          },
        }),
      ]);
    }

    return successResponse({ received: true });
  } catch {
    return errorResponse("Webhook processing failed", 500);
  }
}
