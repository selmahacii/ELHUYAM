import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, zrCreateParcel, zrSearchTerritories } from "@/lib/zrexpress";
import { getWilayaByCode } from "@/lib/wilayas";

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

    // Format phone number cleanly (e.g. 0770386357)
    let phoneClean = (order.shippingPhone ?? "").replace(/\s+/g, "").replace(/^(\+213|00213|213)/, "0");
    if (!phoneClean.startsWith("0") && phoneClean.length === 9) {
      phoneClean = "0" + phoneClean;
    }

    // Get wilaya name and code
    const wilayaObj = getWilayaByCode(order.wilayaCode ?? "");
    const wilayaCode = order.wilayaCode ?? "16";
    const wilayaName = wilayaObj ? wilayaObj.name : (order.shippingState ?? "Alger");

    // Build the package description/items list
    const description = order.items
      .map((item: any) => `${item.productTitle} (x${item.quantity})`)
      .join(", ");

    const customerName = `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim() || "Client";
    const deliveryAddress = (order.shippingStreet || order.shippingCity || wilayaName || "Alger").trim();

    // Map ZR Express delivery type ('home' or 'pickup-point')
    const zrDeliveryType = (order.deliveryType === "STOPDESK" || order.deliveryType === "pickup-point")
      ? "pickup-point"
      : "home";

    let phoneIntl = phoneClean;
    if (phoneIntl.startsWith("0")) {
      phoneIntl = "+213" + phoneIntl.slice(1);
    } else if (!phoneIntl.startsWith("+")) {
      phoneIntl = "+213" + phoneIntl;
    }

    const customerId = crypto.randomUUID();

    const orderedProducts = order.items.map((item: any) => ({
      productName: item.productTitle,
      unitPrice: item.price ?? 0,
      quantity: item.quantity,
      stockType: "none",
    }));

    const fullStreetAddress = `${order.shippingStreet || ""}, ${order.shippingCity || ""}, ${wilayaName}`.replace(/^,\s*/, "").trim() || wilayaName;

    let cityTerritoryId = "53c9e062-9c4e-4c77-8b71-55eabf887f83";
    let districtTerritoryId = "8d0b6cd9-7712-47d2-9ea4-460246494c32";

    try {
      const terrRes = await zrSearchTerritories(settings, order.shippingCity || wilayaName);
      if (terrRes.ok && terrRes.data?.items?.length > 0) {
        const item = terrRes.data.items[0];
        if (item.cityTerritoryId) cityTerritoryId = item.cityTerritoryId;
        if (item.id || item.districtTerritoryId) districtTerritoryId = item.id || item.districtTerritoryId;
      }
    } catch {
      // fallback
    }

    const rawDesc = description || "Habillements Modest Fashion";
    const cleanDesc = rawDesc.length > 240 ? rawDesc.slice(0, 240) : rawDesc;

    // Prepare ZR Express parcel payload per official CreateParcelRequest API schema
    const payload = {
      customer: {
        customerId,
        name: customerName,
        phone: {
          number1: phoneIntl,
        },
      },
      deliveryAddress: {
        street: fullStreetAddress,
        cityTerritoryId,
        districtTerritoryId,
      },
      orderedProducts,
      deliveryType: zrDeliveryType,
      amount: order.paymentStatus === "PAID" ? 0 : Math.round(order.totalAmount),
      description: cleanDesc,
      externalId: order.orderNumber || order.id,
    };

    // Call the API
    const res = await zrCreateParcel(settings, payload);

    if (!res.ok || !res.data) {
      const errorMsg = res.error || res.rawBody || "Erreur lors de la création du colis chez ZR Express";
      return NextResponse.json({
        success: false,
        error: errorMsg,
        errorDetails: {
          status: res.status,
          rawBody: res.rawBody
        }
      }, { status: 400 });
    }

    const parcel = res.data;

    // Update order with tracking number and carrier info
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: {
          trackingNumber: parcel.trackingNumber,
          carrier: "ZR_EXPRESS",
          zrParcelId: parcel.id,
          status: "CONFIRMED",
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          note: `Colis transmis automatiquement à ZR Express. N° Suivi: ${parcel.trackingNumber}`,
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
