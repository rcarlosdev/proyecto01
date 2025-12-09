import { NextResponse } from "next/server";
import { findPaymentByReference } from "@/lib/payments";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const referenceId = url.searchParams.get("referenceId");
    if (!referenceId) return NextResponse.json({ error: "referenceId requerido" }, { status: 400 });

    const payment = await findPaymentByReference(referenceId);
    if (!payment) return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });

    return NextResponse.json({ ok: true, payment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error consultando estado" }, { status: 500 });
  }
}
