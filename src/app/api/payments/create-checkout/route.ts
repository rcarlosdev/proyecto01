// src/app/api/payments/create-checkout/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      amount,         // en centavos: 1000 = 10.00
      currency,       // "usd", "cop", etc.
      referenceId,    // tu referencia interna (ej: id de orden)
      description,    // texto que verá el usuario
      customerEmail,  // opcional: correo del cliente
    } = body;

    if (!amount || !currency || !referenceId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (amount, currency, referenceId)" },
        { status: 400 }
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
            unit_amount: amount,
            product_data: {
              name: description || "Pago",
            },
          },
        },
      ],
      // donde redirige después de pagar o cancelar
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagos/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pagos/cancelled`,
      customer_email: customerEmail,
      metadata: {
        referenceId, // aquí va tu referencia
        origen: "web_app_demo", // opcional
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Error creando checkout:", err);
    return NextResponse.json(
      { error: "Error creando checkout", details: err.message },
      { status: 500 }
    );
  }
}
