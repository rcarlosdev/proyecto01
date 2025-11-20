import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { tradeId } = await req.json();
    if (!tradeId) return NextResponse.json({ success: false, error: "Falta tradeId" }, { status: 400 });

    const [t] = await db.select().from(trades).where(eq(trades.id, String(tradeId)));
    if (!t) return NextResponse.json({ success: false, error: "Trade no encontrado" }, { status: 404 });
    if (String(t.status) !== "pending") {
      return NextResponse.json({ success: false, error: "Solo se pueden cancelar órdenes pendientes" }, { status: 400 });
    }

    // Puedes elegir: borrar el trade o marcarlo "closed" con metadata de cancelación. Aquí: cerrarlo sin PnL.
    const [closed] = await db.update(trades).set({
      status: "closed",
      closePrice: null,
      profit: "0.00",
      closedAt: new Date(),
      metadata: {
        ...(typeof t.metadata === "string" ? (() => { try { return JSON.parse(t.metadata); } catch { return {}; } })() : (t.metadata || {})),
        cancelled: true,
        cancelledAt: new Date().toISOString(),
      } as any,
    }).where(eq(trades.id, t.id)).returning();

    await db.insert(transactions).values({
      id: crypto.randomUUID(),
      userId: t.userId,
      type: "trade",
      amount: "0.00",
      status: "completed",
      metadata: {
        tradeId: t.id,
        cancelled: true,
      } as any,
    } as any);

    return NextResponse.json({ success: true, trade: closed });
  } catch (e) {
    console.error("cancel pending:", e);
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
