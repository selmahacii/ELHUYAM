import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { getWilayaByCode, getShippingCost } from "@/lib/wilayas";
import { revalidatePath } from "next/cache";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "ADMIN" && role !== "CONFIRMATRICE") {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await req.json();

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!existingOrder) {
      return errorResponse("Commande introuvable", 404);
    }

    const {
      shippingFirstName,
      shippingLastName,
      shippingPhone,
      shippingStreet,
      shippingCity,
      wilayaCode,
      deliveryType,
      notes,
      items,
      shippingFeeOverride,
      status,
      paymentStatus,
    } = body;

    const finalWilayaCode = wilayaCode ?? existingOrder.wilayaCode ?? "16";
    const wilayaObj = getWilayaByCode(finalWilayaCode);
    const finalWilayaName = wilayaObj ? wilayaObj.name : (shippingCity ?? existingOrder.shippingCity ?? "Alger");
    const finalDeliveryType = deliveryType ?? existingOrder.deliveryType ?? "DOMICILE";

    // Build items payload
    let updatedItemsList = items;
    if (!Array.isArray(updatedItemsList)) {
      updatedItemsList = existingOrder.items.map((i: any) => ({
        productId: i.productId,
        productTitle: i.productTitle,
        productImage: i.productImage,
        quantity: i.quantity,
        price: i.price,
        size: i.size,
        color: i.color,
      }));
    }

    // Calculate subtotal
    const subtotal = updatedItemsList.reduce((sum: number, item: any) => {
      const q = Math.max(1, parseInt(item.quantity ?? 1, 10));
      const p = Math.max(0, parseFloat(item.price ?? 0));
      return sum + (p * q);
    }, 0);

    // Calculate shipping fee
    let shippingFee = existingOrder.shippingFee;
    if (typeof shippingFeeOverride === "number") {
      shippingFee = shippingFeeOverride;
    } else {
      shippingFee = getShippingCost(finalWilayaCode, finalDeliveryType, subtotal);
    }

    // Calculate total amount
    const totalAmount = Math.max(0, subtotal + shippingFee - existingOrder.discount);

    // Perform database transaction
    await db.$transaction(async (tx: any) => {
      // 1. Re-sync order items if items array was supplied
      if (Array.isArray(items)) {
        await tx.orderItem.deleteMany({
          where: { orderId: id },
        });

        if (items.length > 0) {
          await tx.orderItem.createMany({
            data: items.map((item: any) => ({
              orderId: id,
              productId: item.productId,
              productTitle: item.productTitle,
              productImage: item.productImage ?? null,
              quantity: Math.max(1, parseInt(item.quantity, 10)),
              price: Math.max(0, parseFloat(item.price)),
              size: item.size || null,
              color: item.color || null,
            })),
          });
        }
      }

      // 2. Update order fields
      await tx.order.update({
        where: { id },
        data: {
          shippingFirstName: shippingFirstName ?? existingOrder.shippingFirstName,
          shippingLastName: shippingLastName ?? existingOrder.shippingLastName,
          shippingPhone: shippingPhone ?? existingOrder.shippingPhone,
          shippingStreet: shippingStreet ?? existingOrder.shippingStreet,
          shippingCity: shippingCity ?? existingOrder.shippingCity,
          shippingState: finalWilayaName,
          wilayaCode: finalWilayaCode,
          deliveryType: finalDeliveryType,
          notes: notes !== undefined ? notes : existingOrder.notes,
          subtotal,
          shippingFee,
          totalAmount,
          ...(status ? { status } : {}),
          ...(paymentStatus ? { paymentStatus } : {}),
        },
      });
      // 3. Record status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: status ?? existingOrder.status,
          note: `Informations / panier mis à jour par l'admin (${session?.user?.name ?? "Admin"})`,
          changedById: session?.user?.id ?? "",
        },
      });
    });

    try {
      revalidatePath("/admin/orders");
      revalidatePath(`/admin/orders/${id}`);
    } catch {}

    const updatedOrder = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    return successResponse(updatedOrder);
  } catch (err: any) {
    console.error("[ADMIN_EDIT_ORDER_ERROR]", err);
    return errorResponse(err?.message || "Échec de la mise à jour de la commande", 500);
  }
}
