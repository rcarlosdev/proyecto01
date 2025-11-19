import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amount,
      currency,
      referenceId,
      description,
      customerEmail,
    } = body;

    if (!amount || !currency || !referenceId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (amount, currency, referenceId)" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl || (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://"))) {
      return NextResponse.json(
        { error: "Config error: base URL inválida" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amount, // ya viene en centavos
            product_data: {
              name: description || `Pago referencia ${referenceId}`,
            },
          },
        },
      ],
      success_url: `${baseUrl}/pagos/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pagos/cancelled`,
      customer_email: customerEmail,
      metadata: {
        referenceId,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe no devolvió URL de checkout" },
        { status: 500 }
      );
    }

    // 👉 Guardar en BD
    await db.insert(payments).values({
      referenceId,
      stripeSessionId: session.id,
      stripeUrl: session.url,
      amount,
      currency,
      status: "pending",
      accountId: "default_account", // Aquí debes asignar la cuenta correspondiente
      customerEmail: customerEmail ?? null,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Error creando checkout:", err);
    return NextResponse.json(
      { error: "Error creando checkout", details: err.message },
      { status: 500 }
    );
  }
}
