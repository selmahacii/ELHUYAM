import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getZRSettings, zrCreateParcel } from "@/lib/zrexpress";
import { getWilayaByCode } from "@/lib/wilayas";
import { updateOrderAdmin } from "@/lib/orders";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) return errorResponse("Unauthorized", 401);

    const { id } = await params;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "CONFIRMATRICE";

    const order = await db.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
        ...(!isAdmin ? { userId: session.user.id } : {}),
      },
      include: {
        items: { include: { product: { select: { title: true, images: true, slug: true } } } },
        user: { select: { name: true, email: true, phone: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
    });

    if (!order) return errorResponse("Order not found", 404);
    return successResponse(order);
  } catch {
    return errorResponse("Failed to fetch order.", 500);
  }
}

const updateOrderSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  trackingNumber: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  note: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "ADMIN" && role !== "CONFIRMATRICE") return errorResponse("Unauthorized", 401);
 
    const { id } = await params;
    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) return errorResponse(parsed.error.errors[0].message);
 
    const { status, paymentStatus, trackingNumber, carrier, note } = parsed.data;
 
    // Fetch existing order to understand state and perform micro-details checks
    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!existingOrder) return errorResponse("Order not found", 404);
 
    // Determine final payment status (Auto-settle payment to PAID when order is DELIVERED)
    let finalPaymentStatus = paymentStatus;
    if (status === "DELIVERED") {
      finalPaymentStatus = "PAID";
    }

    // Capture target carrier and tracking info
    let finalCarrier = carrier !== undefined ? carrier : existingOrder.carrier;
    const finalStatus = status !== undefined ? status : existingOrder.status;
    const finalTracking = trackingNumber !== undefined ? trackingNumber : existingOrder.trackingNumber;

    let autoTrackingNumber = finalTracking;
    let autoParcelId = existingOrder.zrParcelId;
    let autoNoteAddition = "";

    // Automatically transmit to ZR Express if status is changing to CONFIRMED for national orders
    const isZRTarget = !finalCarrier || finalCarrier === "ZR_EXPRESS";
    if (finalStatus === "CONFIRMED" && !existingOrder.isInternational && isZRTarget && !autoTrackingNumber) {
      finalCarrier = "ZR_EXPRESS";
      const settings = await getZRSettings();
      if (!settings) {
        return errorResponse(
          "Impossible de confirmer la commande car ZR Express n'est pas configuré. Saisissez vos identifiants API dans Paramètres > Livraison.",
          400
        );
      }

      // Format phone number cleanly (e.g. 0770386357)
      let phoneClean = (existingOrder.shippingPhone ?? "").replace(/\s+/g, "").replace(/^(\+213|00213|213)/, "0");
      if (!phoneClean.startsWith("0") && phoneClean.length === 9) {
        phoneClean = "0" + phoneClean;
      }

      const wilayaObj = getWilayaByCode(existingOrder.wilayaCode ?? "");
      const wilayaCode = existingOrder.wilayaCode ?? "16";
      const wilayaName = wilayaObj ? wilayaObj.name : (existingOrder.shippingState ?? "Alger");

      const description = existingOrder.items
        .map((item: any) => `${item.productTitle} (x${item.quantity})`)
        .join(", ");

      const isPaid = (finalPaymentStatus ?? existingOrder.paymentStatus) === "PAID";
      const customerName = `${existingOrder.shippingFirstName ?? ""} ${existingOrder.shippingLastName ?? ""}`.trim() || "Client";
      const deliveryAddress = (existingOrder.shippingStreet || existingOrder.shippingCity || wilayaName || "Alger").trim();

      const zrDeliveryType = (existingOrder.deliveryType === "STOPDESK" || existingOrder.deliveryType === "pickup-point")
        ? "pickup-point"
        : "home";

      let phoneIntl = phoneClean;
      if (phoneIntl.startsWith("0")) {
        phoneIntl = "+213" + phoneIntl.slice(1);
      } else if (!phoneIntl.startsWith("+")) {
        phoneIntl = "+213" + phoneIntl;
      }

      const customerId = crypto.randomUUID();

      const orderedProducts = existingOrder.items.map((item: any) => ({
        productName: item.productTitle,
        unitPrice: item.price ?? 0,
        quantity: item.quantity,
        stockType: "none",
      }));

      const rawDesc = description || "Habillements Modest Fashion";
      const cleanDesc = rawDesc.length > 240 ? rawDesc.slice(0, 240) : rawDesc;

      const fullStreetAddress = `${existingOrder.shippingStreet || ""}, ${existingOrder.shippingCity || ""}, ${wilayaName}`.replace(/^,\s*/, "").trim() || wilayaName;

      let cityTerritoryId = "53c9e062-9c4e-4c77-8b71-55eabf887f83";
      let districtTerritoryId = "8d0b6cd9-7712-47d2-9ea4-460246494c32";

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
        amount: isPaid ? 0 : Math.round(existingOrder.totalAmount),
        description: cleanDesc,
        externalId: existingOrder.orderNumber || existingOrder.id,
      };

      const zrRes = await zrCreateParcel(settings, payload);
      if (!zrRes.ok || !zrRes.data) {
        return errorResponse(
          `Erreur lors de la création du colis chez ZR Express : ${zrRes.error ?? "API inaccessible"}`,
          400
        );
      }

      autoTrackingNumber = zrRes.data.trackingNumber;
      autoParcelId = zrRes.data.id;
      autoNoteAddition = ` [Transmis automatiquement à ZR Express. N° Suivi: ${autoTrackingNumber}]`;
    }

    const order = await updateOrderAdmin(
      id,
      {
        status,
        paymentStatus,
        trackingNumber: autoTrackingNumber,
        carrier: finalCarrier,
        note: (note ?? "") + autoNoteAddition || undefined,
        zrParcelId: autoParcelId,
      },
      session?.user?.id
    );
 
    revalidateTag("orders", "default");
    return successResponse(order);
  } catch (err) {
    console.error("Error updating order:", err);
    return errorResponse("Failed to update order.", 500);
  }
}
