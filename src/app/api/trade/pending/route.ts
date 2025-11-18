// /app/api/trade/pending/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades, user, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId, symbol, side, quantity, leverage = 1, triggerPrice, triggerRule, expiresAt } = await req.json();

    if (!userId || !symbol || !side || !quantity || !triggerPrice || !triggerRule) {
      return NextResponse.json({ success: false, error: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!["buy", "sell"].includes(side)) {
      return NextResponse.json({ success: false, error: "Side inválido" }, { status: 400 });
    }
    if (!["gte", "lte"].includes(triggerRule)) {
      return NextResponse.json({ success: false, error: "TriggerRule inválido" }, { status: 400 });
    }

    // Validar usuario
    const [u] = await db.select().from(user).where(eq(user.id, String(userId)));
    if (!u) return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });

    // Importante: NO descontamos margen aún. Se descuenta al activar.
    const [pendingTrade] = await db.insert(trades).values({
      id: crypto.randomUUID(),
      userId,
      symbol,
      side,
      quantity,
      leverage,
      status: "pending",
      triggerPrice,
      triggerRule, // "gte" (al alza) o "lte" (a la baja)
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: { createdFrom: "pending-ui" },
    } as any).returning();

    // Registro transaccional en estado pending (opcional, pero útil para auditoría)
    await db.insert(transactions).values({
      id: crypto.randomUUID(),
      userId,
      type: "trade",
      amount: "0.00",
      status: "pending",
      currency: "USD",
      metadata: {
        pendingTradeId: pendingTrade.id,
        symbol,
        side,
        quantity,
        leverage,
        triggerPrice,
        triggerRule,
      } as any,
    } as any);

    return NextResponse.json({ success: true, trade: pendingTrade });
  } catch (error) {
    console.error("❌ Error creando pendiente:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
