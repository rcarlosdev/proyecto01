// src/app/api/payments/status/route.ts
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Falta session_id" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  return NextResponse.json({
    payment_status: session.payment_status,
    status: session.status,
    referenceId: session.metadata?.referenceId,
    amount: session.amount_total,
    currency: session.currency,
  });
}
