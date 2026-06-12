import { NextRequest, NextResponse } from "next/server";
import { constructWebhookEvent } from "@/lib/stripe";
import { db } from "@/lib/db";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = await constructWebhookEvent(payload, signature);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId in metadata" }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, totalAmount: true, paymentStatus: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency — skip if already processed
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ received: true });
    }

    // SECURITY: Verify Stripe amount_total (centimes) matches stored order total
    // DZD has no decimal subdivisions so we multiply by 100 to match Stripe's cents
    const stripePaidCents = session.amount_total ?? 0;
    const orderExpectedCents = Math.round(order.totalAmount * 100);

    if (Math.abs(stripePaidCents - orderExpectedCents) > 1) {
      console.error(
        `[stripe-webhook] AMOUNT MISMATCH orderId=${orderId} ` +
        `expected=${orderExpectedCents} got=${stripePaidCents} — order NOT fulfilled`
      );
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    await db.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        stripePaymentId: (session.payment_intent as string) ?? null,
        statusHistory: {
          create: { status: "CONFIRMED", note: "Payment confirmed via Stripe" },
        },
      },
    });
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const orderId = intent.metadata?.orderId;
    if (orderId) {
      await db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "FAILED" },
      });
    }
  }

  return NextResponse.json({ received: true });
}
