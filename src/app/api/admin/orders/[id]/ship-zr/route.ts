import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { getZRSettings, zrCreateParcel } from "@/lib/zrexpress";
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

    // Get wilaya name or fallback
    const wilaya = getWilayaByCode(order.wilayaCode ?? "");
    const wilayaName = wilaya ? wilaya.name : (order.shippingState ?? "Alger");

    // Build the package description/items list
    const description = order.items
      .map((item: any) => `${item.productTitle} (x${item.quantity})`)
      .join(", ");

    // Prepare ZR Express parcel payload
    const payload = {
      customerName: `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim(),
      customerPhone: order.shippingPhone ?? "",
      address: order.shippingStreet ?? "",
      wilaya: wilayaName,
      deliveryType: order.deliveryType, // DOMICILE or STOPDESK
      amount: order.paymentStatus === "PAID" ? 0 : order.totalAmount, // COD amount
      description: description || "Habillements Modest Fashion",
    };

    // Call the API
    const res = await zrCreateParcel(settings, payload);

    if (!res.ok || !res.data) {
      return errorResponse(res.error ?? "Erreur lors de la création du colis chez ZR Express", 400);
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
          status: "OUT_FOR_DELIVERY",
        },
      }),
      db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "OUT_FOR_DELIVERY",
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
