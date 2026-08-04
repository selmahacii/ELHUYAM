import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, zrCreateParcel, zrSearchTerritories, resolveZRTerritoryIds, resolveZRHubId } from "@/lib/zrexpress";
import { getWilayaByCode } from "@/lib/wilayas";
import { sendOrderShippedEmail } from "@/lib/email";

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

    const rawStreet = (order.shippingStreet || "").trim();
    const rawCity = (order.shippingCity || "").trim();
    let fullStreetAddress = rawStreet;
    if (!fullStreetAddress) {
      fullStreetAddress = rawCity ? `${rawCity}, ${wilayaName}` : wilayaName;
    } else if (rawCity && !rawStreet.toLowerCase().includes(rawCity.toLowerCase())) {
      fullStreetAddress = `${rawStreet}, ${rawCity}`;
    }

    const { cityTerritoryId, districtTerritoryId } = await resolveZRTerritoryIds(
      settings,
      wilayaName,
      wilayaCode,
      order.shippingCity,
      order.shippingStreet
    );

    const rawDesc = description || "Habillements Modest Fashion";
    const cleanDesc = rawDesc.length > 240 ? rawDesc.slice(0, 240) : rawDesc;

    let hubId: string | null = null;
    if (zrDeliveryType === "pickup-point") {
      hubId = await resolveZRHubId(
        settings,
        wilayaName,
        wilayaCode,
        order.shippingCity,
        order.shippingStreet
      );
    }

    // Prepare ZR Express parcel payload per official CreateParcelRequest API schema
    const payload: Record<string, any> = {
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

    if (zrDeliveryType === "pickup-point" && hubId) {
      payload.hubId = hubId;
    }

    // Call the API
    const res = await zrCreateParcel(settings, payload);

    if (!res.ok || !res.data) {
      const errorMsg = res.error || res.rawBody || "Error creating parcel at ZR Express";
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
    const trackingNumber = parcel.trackingNumber || (parcel as any).tracking || (parcel as any).barcode || parcel.id;
    const zrParcelId = parcel.id || (parcel as any).parcelId || trackingNumber;

    // Update order with tracking number and carrier info
    await db.$transaction([
      db.order.update({
        where: { id: order.id },
        data: {
          trackingNumber,
          carrier: "ZR_EXPRESS",
          zrParcelId,
          status: "CONFIRMED",
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          note: `Automatically transmitted to ZR Express. Tracking N°: ${trackingNumber}`,
          changedById: session.user.id,
        },
      }),
    ]);

    // Send shipping confirmation email to the customer!
    const userEmail = (await db.user.findUnique({ where: { id: order.userId } }))?.email;
    if (userEmail) {
      const customerName = `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim() || "Customer";
      sendOrderShippedEmail(
        userEmail,
        customerName,
        order.orderNumber,
        trackingNumber,
        order.totalAmount,
        order.isInternational,
        order.items.map((i: any) => ({
          productTitle: i.productTitle,
          quantity: i.quantity,
          price: i.price,
        }))
      ).catch((err) => console.error("[email/shipped/ship-zr]", err));
    }

    return successResponse({
      trackingNumber,
      message: "Package successfully created and transmitted to ZR Express",
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Internal Server Error", 500);
  }
}
