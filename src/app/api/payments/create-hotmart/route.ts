import { NextResponse } from "next/server";
import { buildHotmartCheckoutUrl } from "@/lib/hotmart";
import { createPendingPayment } from "@/lib/payments";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      amount,
      currency,
      referenceId,
      description,
      customerEmail,
      userId,
      redirect
    } = body;

    // Validaciones básicas
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    if (!referenceId) return NextResponse.json({ error: "referenceId requerido" }, { status: 400 });
    if (typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "amount inválido" }, { status: 400 });
    }

    const base = process.env.HOTMART_CHECKOUT_BASE!;
    if (!base) return NextResponse.json({ error: "HOTMART_CHECKOUT_BASE no configurado" }, { status: 500 });

    // Construir URL Hotmart
    const checkoutUrl = buildHotmartCheckoutUrl({
      base,
      email: customerEmail,
      referenceId,
      amount,
      currency: currency || "USD",
      description,
      redirect
    });

    // Guardar registro pendiente en payments
    const paymentId = await createPendingPayment({
      referenceId,
      provider: "hotmart",
      checkoutUrl,
      amount,
      currency: currency || "USD",
      userId,
      customerEmail,
      providerRequest: { createdAt: new Date().toISOString(), requestBody: body }
    });

    return NextResponse.json({ ok: true, id: paymentId, url: checkoutUrl });
  } catch (err) {
    console.error("create-hotmart err:", err);
    return NextResponse.json({ error: "Error creando link Hotmart" }, { status: 500 });
  }
}
