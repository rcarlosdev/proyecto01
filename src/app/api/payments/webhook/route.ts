import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();
  const sig = headerList.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Firma webhook inválida:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Actualizamos por sessionId (es más seguro)
        await db
          .update(payments)
          .set({
            status: "paid",
            updatedAt: new Date(),
          })
          .where(eq(payments.stripeSessionId, session.id));

        console.log("✅ Pago marcado como PAID:", session.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const referenceId = pi.metadata?.referenceId;

        if (referenceId) {
          await db
            .update(payments)
            .set({
              status: "failed",
              updatedAt: new Date(),
            })
            .where(eq(payments.referenceId, referenceId));

          console.log("❌ Pago marcado como FAILED:", referenceId);
        }
        break;
      }

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Error procesando webhook:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
