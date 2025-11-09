// /app/api/trade/close/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades, user, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { tradeId, closePrice } = await req.json();

    if (!tradeId) {
      return NextResponse.json(
        { success: false, error: "Falta tradeId" },
        { status: 400 }
      );
    }

    // Buscar trade (id string)
    const [trade] = await db.select().from(trades).where(eq(trades.id, String(tradeId)));
    if (!trade) return NextResponse.json({ success: false, error: "Trade no encontrado" }, { status: 404 });
    if (trade.status === "closed") {
      return NextResponse.json({ success: false, error: "La operación ya está cerrada" }, { status: 400 });
    }

    const entry = Number(trade.entryPrice ?? 0);
    const qty = Number(trade.quantity ?? 0);
    const leverage = Number(trade.leverage ?? 1);

    // Derivar close si no llegó
    const close =
      closePrice && Number(closePrice) > 0
        ? Number(closePrice)
        : Number((entry * (1 + (Math.random() - 0.5) * 0.02)).toFixed(5));

    const side = trade.side === "buy" ? 1 : -1;
    const profit = Number(((close - entry) * qty * leverage * side).toFixed(2));

    await db
      .update(trades)
      .set({
        closePrice: close.toFixed(4),
        profit: profit.toFixed(2),
        status: "closed",
        closedAt: new Date(),
      })
      .where(eq(trades.id, trade.id));

    const [u] = await db.select().from(user).where(eq(user.id, trade.userId));
    const currentBalance = Number(u?.balance ?? 0);

    const md = typeof trade.metadata === "string" ? (() => { try { return JSON.parse(trade.metadata); } catch { return {}; } })() : (trade.metadata || {});
    const releasedMargin = Number(md?.marginUsed ?? entry * qty) || 0;

    const newBalance = currentBalance + releasedMargin + profit;
    await db.update(user).set({ balance: newBalance.toFixed(2) }).where(eq(user.id, trade.userId));

    await db.insert(transactions).values([{
      id: crypto.randomUUID(),
      userId: trade.userId,
      type: "trade_close",
      amount: profit.toFixed(2),
      status: "completed",
      metadata: JSON.stringify({
        tradeId: trade.id,
        symbol: trade.symbol,
        entryPrice: entry.toFixed(4),
        closePrice: close.toFixed(4),
        quantity: qty,
        leverage,
        profit,
      }),
    } as any]);

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        entryPrice: entry.toFixed(4),
        closePrice: close.toFixed(4),
        quantity: qty,
        leverage,
        profit: profit.toFixed(2),
        status: "closed",
        createdAt: trade.createdAt,
        closedAt: new Date().toISOString(),
        metadata: md,
      },
      newBalance: newBalance.toFixed(2),
    });
  } catch (error) {
    console.error("❌ close trade:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
