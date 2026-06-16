import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, zrGetParcelByTracking, zrGetStateHistory } from "@/lib/zrexpress";

type Props = { params: Promise<{ trackingNumber: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "CONFIRMATRICE"].includes(session.user.role as string)) {
      return errorResponse("Unauthorized", 401);
    }

    const { trackingNumber } = await params;
    const settings = await getZRSettings();
    if (!settings) return errorResponse("ZR Express not configured", 503);

    const parcelRes = await zrGetParcelByTracking(settings, trackingNumber);

    if (!parcelRes.ok || !parcelRes.data) {
      // Lazy Sync Fallback: If tracking number exists on our side but returns 404 Not Found on ZR Express,
      // it was likely deleted on their platform. Mark order as CANCELLED.
      const existingOrder = await db.order.findFirst({
        where: { trackingNumber },
      });
      if (existingOrder && existingOrder.status !== "CANCELLED" && existingOrder.status !== "REFUNDED") {
        await db.$transaction([
          db.order.update({
            where: { id: existingOrder.id },
            data: { status: "CANCELLED" },
          }),
          db.orderStatusHistory.create({
            data: {
              orderId: existingOrder.id,
              status: "CANCELLED",
              note: "Sync: Colis introuvable sur ZR Express (supprimé sur leur plateforme)",
            },
          }),
        ]);
        console.log(`[ZR Express Sync] Order ${existingOrder.orderNumber} marked as CANCELLED because it was deleted on ZR Express.`);
      }

      return errorResponse(parcelRes.error ?? "Parcel not found", 404);
    }

    const parcel = parcelRes.data;
    let history: unknown[] = [];

    if (parcel.id) {
      const histRes = await zrGetStateHistory(settings, parcel.id);
      if (histRes.ok && histRes.data) history = histRes.data;
    }

    return successResponse({ parcel, history });
  } catch {
    return errorResponse("Failed to fetch tracking", 500);
  }
}
