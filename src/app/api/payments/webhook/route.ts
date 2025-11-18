// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";

export const runtime = "nodejs";

// Usa la versión que te marca Stripe en el dashboard: 2025-10-29.clover
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: Request) {
  // 1) Obtener el cuerpo como texto (NO json)
  const body = await req.text();

  // 2) Obtener headers (en tu versión de types, es async)
  const headerList = await headers();
  const sig = headerList.get("stripe-signature") ?? "";

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("❌ Falta STRIPE_WEBHOOK_SECRET en .env.local");
    return new NextResponse("Config error", { status: 500 });
  }

  let event: Stripe.Event;

  try {
    // 3) Verificar firma del webhook
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("❌ Error verificando firma del webhook:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log("📩 Evento recibido:", event.type);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        const referenceId = session.metadata?.referenceId;
        const paymentStatus = session.payment_status; // "paid"
        const amount = session.amount_total;
        const currency = session.currency;

        // 👉 Aquí actualizas tu BD con referenceId
        console.log("✅ Pago completado para referencia:", referenceId, {
          paymentStatus,
          amount,
          currency,
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("❌ Pago fallido, metadata:", pi.metadata);
        break;
      }

      default:
        console.log(`ℹ️ Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Error manejando evento de webhook:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
