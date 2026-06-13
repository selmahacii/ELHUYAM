import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getZRSettings, zrCreateParcel } from "@/lib/zrexpress";
import { getWilayaByCode } from "@/lib/wilayas";

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
 
    // If order status is changing
    if (status && status !== existingOrder.status) {
      // 1. Automatic Stock Restocking / Decrementing
      const isCurrentlyDestructive = existingOrder.status === "CANCELLED" || existingOrder.status === "REFUNDED";
      const isNewDestructive = status === "CANCELLED" || status === "REFUNDED";

      if (isNewDestructive && !isCurrentlyDestructive) {
        // Restock items within transaction
        await db.$transaction(async (tx: any) => {
          for (const item of existingOrder.items) {
            if (item.size || item.color) {
              const variant = await tx.productVariant.findFirst({
                where: {
                  productId: item.productId,
                  size: item.size || null,
                  color: item.color || null,
                },
              });
              if (variant) {
                await tx.productVariant.update({
                  where: { id: variant.id },
                  data: { stock: { increment: item.quantity } },
                });
                continue;
              }
            }
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        });
      } else if (!isNewDestructive && isCurrentlyDestructive) {
        // Decrement items again within transaction
        await db.$transaction(async (tx: any) => {
          for (const item of existingOrder.items) {
            if (item.size || item.color) {
              const variant = await tx.productVariant.findFirst({
                where: {
                  productId: item.productId,
                  size: item.size || null,
                  color: item.color || null,
                },
              });
              if (variant) {
                const updated = await tx.productVariant.updateMany({
                  where: { id: variant.id, stock: { gte: item.quantity } },
                  data: { stock: { decrement: item.quantity } },
                });
                if (updated.count > 0) continue;
              }
            }
            const updated = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (updated.count === 0) {
              throw new Error(`STOCK_DEPLETED:${item.productTitle}`);
            }
          }
        });
      }
    }
 
    // Determine final payment status (Auto-settle payment to PAID when order is DELIVERED)
    let finalPaymentStatus = paymentStatus;
    if (status === "DELIVERED") {
      finalPaymentStatus = "PAID";
    }

    // Capture target carrier and tracking info
    const finalCarrier = carrier !== undefined ? carrier : existingOrder.carrier;
    const finalStatus = status !== undefined ? status : existingOrder.status;
    const finalTracking = trackingNumber !== undefined ? trackingNumber : existingOrder.trackingNumber;

    let autoTrackingNumber = finalTracking;
    let autoParcelId = existingOrder.zrParcelId;
    let autoNoteAddition = "";

    // Automatically transmit to ZR Express if status is changing to OUT_FOR_DELIVERY
    if (finalStatus === "OUT_FOR_DELIVERY" && finalCarrier === "ZR_EXPRESS" && !autoTrackingNumber) {
      const settings = await getZRSettings();
      if (!settings) {
        return errorResponse(
          "Impossible de confirmer la commande car ZR Express n'est pas configuré. Saisissez vos identifiants API dans Paramètres > Livraison.",
          400
        );
      }

      const wilaya = getWilayaByCode(existingOrder.wilayaCode ?? "");
      const wilayaName = wilaya ? wilaya.name : (existingOrder.shippingState ?? "Alger");
      const description = existingOrder.items
        .map((item: any) => `${item.productTitle} (x${item.quantity})`)
        .join(", ");

      const isPaid = (finalPaymentStatus ?? existingOrder.paymentStatus) === "PAID";

      const payload = {
        customerName: `${existingOrder.shippingFirstName ?? ""} ${existingOrder.shippingLastName ?? ""}`.trim(),
        customerPhone: existingOrder.shippingPhone ?? "",
        address: existingOrder.shippingStreet ?? "",
        wilaya: wilayaName,
        deliveryType: existingOrder.deliveryType, // DOMICILE or STOPDESK
        amount: isPaid ? 0 : existingOrder.totalAmount, // COD amount to collect
        description: description || "Habillements Modest Fashion",
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
 
    const order = await db.order.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(finalPaymentStatus ? { paymentStatus: finalPaymentStatus } : {}),
        ...(autoTrackingNumber !== undefined ? { trackingNumber: autoTrackingNumber } : {}),
        ...(finalCarrier !== undefined ? { carrier: finalCarrier } : {}),
        ...(autoParcelId ? { zrParcelId: autoParcelId } : {}),
        ...(status
          ? { statusHistory: { create: { status, note: (note ?? "") + autoNoteAddition || undefined, changedById: session?.user?.id } } }
          : {}),
      },
      include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
    });
 
    revalidateTag("orders", "default");
    return successResponse(order);
  } catch (err) {
    console.error("Error updating order:", err);
    return errorResponse("Failed to update order.", 500);
  }
}
