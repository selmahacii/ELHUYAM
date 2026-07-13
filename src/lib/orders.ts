import { db } from "./db";

export async function updateOrderAdmin(
  orderId: string,
  updates: {
    status?: any;
    paymentStatus?: any;
    trackingNumber?: string | null;
    carrier?: string | null;
    note?: string;
    zrParcelId?: string | null;
  },
  changedById?: string
) {
  return await db.$transaction(async (tx: any) => {
    // 1. Fetch the order with its items to know the current state
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });

    if (!order) {
      throw new Error("Order not found");
    }

    const statusChanged = updates.status !== undefined && updates.status !== order.status;

    if (statusChanged) {
      const oldStatus = order.status;
      const newStatus = updates.status;

      const isCurrentlyDestructive = oldStatus === "CANCELLED" || oldStatus === "REFUNDED";
      const isNewDestructive = newStatus === "CANCELLED" || newStatus === "REFUNDED";

      if (isNewDestructive && !isCurrentlyDestructive) {
        // Restock items: increase stock of variant or product
        for (const item of order.items) {
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
      } else if (!isNewDestructive && isCurrentlyDestructive) {
        // Re-deduct items stock: decrease stock of variant or product
        for (const item of order.items) {
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
      }
    }

    // Auto-settle payment to PAID when order is DELIVERED
    let finalPaymentStatus = updates.paymentStatus !== undefined ? updates.paymentStatus : order.paymentStatus;
    if (updates.status === "DELIVERED") {
      finalPaymentStatus = "PAID";
    }

    // 2. Perform order update in database
    return await tx.order.update({
      where: { id: orderId },
      data: {
        ...(updates.status ? { status: updates.status } : {}),
        paymentStatus: finalPaymentStatus,
        ...(updates.trackingNumber !== undefined ? { trackingNumber: updates.trackingNumber } : {}),
        ...(updates.carrier !== undefined ? { carrier: updates.carrier } : {}),
        ...(updates.zrParcelId !== undefined ? { zrParcelId: updates.zrParcelId } : {}),
        ...(updates.status
          ? {
              statusHistory: {
                create: {
                  status: updates.status,
                  note: updates.note || undefined,
                  changedById: changedById || undefined
                }
              }
            }
          : {})
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                title: true,
                images: true,
                slug: true
              }
            }
          }
        },
        statusHistory: {
          orderBy: {
            createdAt: "asc"
          }
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true
          }
        },
        coupon: {
          select: {
            code: true,
            discountType: true,
            discountValue: true
          }
        }
      }
    });
  });
}
