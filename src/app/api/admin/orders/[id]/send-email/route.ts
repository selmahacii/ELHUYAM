import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/auth";
import { sendOrderConfirmationEmail, sendOrderShippedEmail } from "@/lib/email";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    const role = session?.user?.role;
    if (role !== "ADMIN" && role !== "CONFIRMATRICE") {
      return errorResponse("Non autorisé", 401);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { type = "confirmation", customEmail } = body;

    const order = await db.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { email: true, name: true } },
      },
    });

    if (!order) {
      return errorResponse("Commande introuvable", 404);
    }

    const recipientEmail = (customEmail || order.user?.email)?.trim();

    if (!recipientEmail || !recipientEmail.includes("@")) {
      return errorResponse(
        "Aucune adresse e-mail valide trouvée pour cette cliente. Veuillez spécifier une adresse.",
        400
      );
    }

    const customerName =
      `${order.shippingFirstName ?? ""} ${order.shippingLastName ?? ""}`.trim() ||
      order.user?.name ||
      "Customer";

    const items = order.items.map((i: any) => ({
      productTitle: i.productTitle,
      quantity: i.quantity,
      price: i.price ?? 0,
      size: i.size || null,
      color: i.color || null,
    }));

    if (type === "shipped") {
      const trackingNumber = order.trackingNumber || "ZR-PENDING";
      await sendOrderShippedEmail(
        recipientEmail,
        customerName,
        order.orderNumber,
        trackingNumber,
        order.totalAmount,
        order.isInternational,
        items
      );
    } else {
      await sendOrderConfirmationEmail(
        recipientEmail,
        customerName,
        order.orderNumber,
        order.totalAmount,
        order.isInternational,
        items
      );
    }

    return successResponse({
      success: true,
      message: `E-mail de ${type === "shipped" ? "livraison" : "confirmation"} envoyé avec succès à ${recipientEmail} !`,
      recipientEmail,
    });
  } catch (error: any) {
    console.error("[admin/send-email] Error:", error);
    return errorResponse(
      error?.message || "Une erreur est survenue lors de l'envoi de l'e-mail.",
      500
    );
  }
}
