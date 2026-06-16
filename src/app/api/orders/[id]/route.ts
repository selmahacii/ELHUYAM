import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { z } from "zod";
import { revalidateTag } from "next/cache";
import { getZRSettings, zrCreateParcel, getTerritoriesForWilaya, toUUID, zrGetParcelByTracking, zrDeleteParcel, getBestHubForWilaya } from "@/lib/zrexpress";
import { getWilayaByCode } from "@/lib/wilayas";
import crypto from "crypto";

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
 
    // Determine final payment status (Auto-settle payment to PAID when order is DELIVERED, and to REFUNDED when REFUNDED)
    let finalPaymentStatus = paymentStatus;
    if (status === "DELIVERED") {
      finalPaymentStatus = "PAID";
    } else if (status === "REFUNDED") {
      finalPaymentStatus = "REFUNDED";
    }

    // Capture target carrier and tracking info
    const finalStatus = status !== undefined ? status : existingOrder.status;
    let finalCarrier = carrier !== undefined ? carrier : existingOrder.carrier;
    if (finalStatus === "OUT_FOR_DELIVERY" && !finalCarrier) {
      finalCarrier = "ZR_EXPRESS";
    }
    const finalTracking = trackingNumber !== undefined ? trackingNumber : existingOrder.trackingNumber;

    let autoTrackingNumber = finalTracking;
    let autoParcelId = existingOrder.zrParcelId;
    let autoNoteAddition = "";

    // If status is changing to CANCELLED and it was sent to ZR Express
    if (status === "CANCELLED" && existingOrder.status !== "CANCELLED" && existingOrder.carrier === "ZR_EXPRESS" && existingOrder.zrParcelId) {
      const settings = await getZRSettings();
      if (settings) {
        const deleteRes = await zrDeleteParcel(settings, existingOrder.zrParcelId);
        if (deleteRes.ok) {
          console.log(`[ZR Express] Parcel ${existingOrder.zrParcelId} deleted successfully due to order cancellation.`);
          autoNoteAddition = " [Deleted from ZR Express platform]";
        } else {
          console.error(`[ZR Express] Failed to delete parcel ${existingOrder.zrParcelId}:`, deleteRes.error);
          autoNoteAddition = ` [Failed to delete from ZR Express: ${deleteRes.error}]`;
        }
      }
    }

    // Automatically transmit to ZR Express if status is changing to OUT_FOR_DELIVERY
    if (finalStatus === "OUT_FOR_DELIVERY" && finalCarrier === "ZR_EXPRESS" && !autoTrackingNumber) {
      const settings = await getZRSettings();
      if (!settings) {
        return errorResponse(
          "Impossible de confirmer la commande car ZR Express n'est pas configuré. Saisissez vos identifiants API dans Paramètres > Livraison.",
          400
        );
      }

      const territories = await getTerritoriesForWilaya(settings, existingOrder.wilayaCode, existingOrder.shippingCity);
      if (!territories) {
        return errorResponse(`Impossible de trouver la wilaya code ${existingOrder.wilayaCode} sur ZR Express.`, 400);
      }

      const descriptionText = existingOrder.items
        .map((item: any) => `${item.productTitle} (x${item.quantity})`)
        .join(", ");

      const isPaid = (finalPaymentStatus ?? existingOrder.paymentStatus) === "PAID";

      let phone = existingOrder.shippingPhone ?? "";
      if (phone.startsWith("0")) phone = "+213" + phone.slice(1);

      const orderedProducts = existingOrder.items.map((item: any) => ({
        unitPrice: item.price,
        quantity: item.quantity,
        productName: item.productTitle,
        stockType: "none",
      }));

      if (orderedProducts.length === 0) {
        orderedProducts.push({
          unitPrice: existingOrder.totalAmount,
          quantity: 1,
          productName: "Commande Générale",
          stockType: "none",
        });
      }

      let hubId: string | null = null;
      if (existingOrder.deliveryType === "STOPDESK") {
        hubId = await getBestHubForWilaya(settings, territories.cityTerritoryId, existingOrder.shippingCity);
        if (!hubId) {
          return errorResponse(
            "Aucun point de retrait (hub) disponible pour cette wilaya chez ZR Express.",
            400
          );
        }
      }

      const payload = {
        customer: {
          customerId: toUUID(existingOrder.userId),
          name: `${existingOrder.shippingFirstName ?? ""} ${existingOrder.shippingLastName ?? ""}`.trim() || "Client Inconnu",
          phone: { number1: phone || "+213000000000" }
        },
        deliveryAddress: {
          street: existingOrder.shippingStreet ?? "",
          cityTerritoryId: territories.cityTerritoryId,
          districtTerritoryId: territories.districtTerritoryId
        },
        deliveryType: existingOrder.deliveryType === "STOPDESK" ? "pickup-point" : "home",
        ...(existingOrder.deliveryType === "STOPDESK" && hubId ? { hubId } : {}),
        amount: isPaid ? 0 : existingOrder.totalAmount,
        description: descriptionText || "Habillements Modest Fashion",
        orderedProducts,
        externalId: existingOrder.orderNumber
      };

      const zrRes = await zrCreateParcel(settings, payload);
      if (!zrRes.ok || !zrRes.data || !zrRes.data.id) {
        return errorResponse(
          `Erreur lors de la création du colis chez ZR Express : ${zrRes.error ?? "API inaccessible"}`,
          400
        );
      }

      const detailsRes = await zrGetParcelByTracking(settings, zrRes.data.id);
      if (!detailsRes.ok || !detailsRes.data) {
        return errorResponse(
          `Impossible de récupérer les détails du colis chez ZR Express : ${detailsRes.error ?? "API inaccessible"}`,
          400
        );
      }

      autoTrackingNumber = detailsRes.data.trackingNumber;
      autoParcelId = detailsRes.data.id;
      autoNoteAddition = ` [Automatically transmitted to ZR Express. Tracking N°: ${autoTrackingNumber}]`;
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
