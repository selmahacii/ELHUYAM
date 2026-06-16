import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, zrCreateParcel, getTerritoriesForWilaya, toUUID, zrGetParcelByTracking, getBestHubForWilaya } from "@/lib/zrexpress";
import { getWilayaByCode } from "@/lib/wilayas";
import crypto from "crypto";

type Props = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user || !["ADMIN", "CONFIRMATRICE"].includes(session.user.role as string)) {
      return errorResponse("Non autorisé", 401);
    }

    const { id } = await params;

    // Load order
    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      return errorResponse("Commande non trouvée", 404);
    }

    // Get ZR Settings
    const settings = await getZRSettings();
    if (!settings) {
      return errorResponse(
        "ZR Express n'est pas configuré. Veuillez saisir vos identifiants API (Secret Key et Tenant ID) dans Paramètres > Livraison.",
        400
      );
    }

    // Get wilaya territories
    const territories = await getTerritoriesForWilaya(settings, order.wilayaCode, order.shippingCity);
    if (!territories) {
      return errorResponse(`Impossible de trouver la wilaya code ${order.wilayaCode} sur ZR Express.`, 400);
    }

    // Format phone number
    let phone = order.shippingPhone ?? "";
    if (phone.startsWith("0")) phone = "+213" + phone.slice(1);

    // Build orderedProducts
    const orderedProducts = order.items.map((item: any) => ({
      unitPrice: item.price,
      quantity: item.quantity,
      productName: item.productTitle,
      stockType: "none",
    }));

    if (orderedProducts.length === 0) {
      orderedProducts.push({
        unitPrice: order.totalAmount,
        quantity: 1,
        productName: "Commande Générale",
        stockType: "none",
      });
    }

    const descriptionText = order.items
      .map((item: any) => `${item.productTitle} (x${item.quantity})`)
      .join(", ");

    let hubId: string | null = null;
    if (order.deliveryType === "STOPDESK") {
      hubId = await getBestHubForWilaya(settings, territories.cityTerritoryId, order.shippingCity);
      if (!hubId) {
        return errorResponse(
          "Aucun point de retrait (hub) disponible pour cette wilaya chez ZR Express.",
          400
        );
      }
    }

    // Prepare ZR Express parcel payload
    const payload = {
      customer: {
        customerId: toUUID(order.userId),
        name: `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim() || "Client Inconnu",
        phone: { number1: phone || "+213000000000" }
      },
      deliveryAddress: {
        street: order.shippingStreet ?? "",
        cityTerritoryId: territories.cityTerritoryId,
        districtTerritoryId: territories.districtTerritoryId
      },
      deliveryType: order.deliveryType === "STOPDESK" ? "pickup-point" : "home",
      ...(order.deliveryType === "STOPDESK" && hubId ? { hubId } : {}),
      amount: order.paymentStatus === "PAID" ? 0 : order.totalAmount,
      description: descriptionText || "Habillements Modest Fashion",
      orderedProducts,
      externalId: order.orderNumber
    };

    // Call the API
    const res = await zrCreateParcel(settings, payload);

    if (!res.ok || !res.data || !res.data.id) {
      return errorResponse(res.error ?? "Erreur lors de la création du colis chez ZR Express", 400);
    }

    const createdId = res.data.id;
    const parcelDetails = await zrGetParcelByTracking(settings, createdId);
    if (!parcelDetails.ok || !parcelDetails.data) {
      return errorResponse(parcelDetails.error ?? "Impossible de récupérer les détails du colis chez ZR Express", 400);
    }
    const parcel = parcelDetails.data;

    // Update order with tracking number and carrier in
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: parcel.trackingNumber,
          carrier: "ZR_EXPRESS",
          zrParcelId: parcel.id,
          status: "OUT_FOR_DELIVERY",
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "OUT_FOR_DELIVERY",
          note: `Parcel automatically transmitted to ZR Express. Tracking N°: ${parcel.trackingNumber}`,
          changedById: session.user.id,
        },
      }),
    ]);

    return successResponse({
      trackingNumber: parcel.trackingNumber,
      message: "Colis transmis avec succès à ZR Express",
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Erreur serveur", 500);
  }
}
