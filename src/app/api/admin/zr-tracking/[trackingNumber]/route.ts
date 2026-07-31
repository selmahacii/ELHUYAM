import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, zrGetParcelByTracking, zrGetStateHistory } from "@/lib/zrexpress";

type Props = { params: Promise<{ trackingNumber: string }> };

// The admin tracking widget polls this route every 30-60s per open order tab,
// and it used to hit ZR Express's live API twice (parcel + state history) on
// every single poll with zero caching. Order status is already kept in sync
// server-side by the ZR webhook (src/app/api/webhooks/zrexpress/route.ts) —
// this endpoint is only for the live tracking widget's display, so a short
// cache is safe and cuts most of that redundant outbound traffic.
const TRACKING_CACHE_TTL_MS = 30_000;
const trackingCache = new Map<string, { data: { parcel: unknown; history: unknown[] }; timestamp: number }>();

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "CONFIRMATRICE"].includes(session.user.role as string)) {
      return errorResponse("Unauthorized", 401);
    }

    const { trackingNumber } = await params;

    const cached = trackingCache.get(trackingNumber);
    if (cached && Date.now() - cached.timestamp < TRACKING_CACHE_TTL_MS) {
      return successResponse(cached.data);
    }

    const settings = await getZRSettings();
    if (!settings) return errorResponse("ZR Express not configured", 503);

    const parcelRes = await zrGetParcelByTracking(settings, trackingNumber);

    if (!parcelRes.ok || !parcelRes.data) {
      return errorResponse(parcelRes.error ?? "Parcel not found", 404);
    }

    const parcel = parcelRes.data;
    let history: unknown[] = [];

    if (parcel.id) {
      const histRes = await zrGetStateHistory(settings, parcel.id);
      if (histRes.ok && histRes.data) history = histRes.data;
    }

    const data = { parcel, history };
    trackingCache.set(trackingNumber, { data, timestamp: Date.now() });

    return successResponse(data);
  } catch {
    return errorResponse("Failed to fetch tracking", 500);
  }
}
