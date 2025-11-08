import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades, user, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { tradeId, closePrice } = await req.json();

    // 1️⃣ Buscar el trade
    const [trade] = await db.select().from(trades).where(eq(trades.id, tradeId));

    if (!trade) {
      return NextResponse.json({ success: false, error: "Trade no encontrado" }, { status: 404 });
    }

    // 2️⃣ Calcular profit (ganancia/pérdida)
    const entry = parseFloat(trade.entryPrice);
    const close = parseFloat(closePrice);
    const qty = parseFloat(trade.quantity);
    const side = trade.side;

    // Fórmula: (close - entry) * cantidad * (1 o -1 según buy/sell)
    const profit =
      (close - entry) * qty * (side === "buy" ? 1 : -1);

    // 3️⃣ Actualizar el trade
    await db
      .update(trades)
      .set({
        closePrice: closePrice,
        profit: profit.toFixed(2),
        status: "closed",
        closedAt: new Date(),
      })
      .where(eq(trades.id, tradeId));

    // 4️⃣ (Opcional) Actualizar balance del usuario
    const [userData] = await db.select().from(user).where(eq(user.id, trade.userId));
    const newBalance = parseFloat(userData?.balance ?? "0") + profit;

    await db
      .update(user)
      .set({ balance: newBalance.toFixed(2) })
      .where(eq(user.id, trade.userId));

    // 5️⃣ (Opcional) Registrar transacción del cierre
    await db.insert(transactions).values({
      userId: trade.userId as any,
      type: "trade_close",
      amount: profit.toFixed(2),
      status: "completed",
      metadata: {
        symbol: trade.symbol,
        entryPrice: trade.entryPrice,
        closePrice,
        profit,
      } as any,
    } as any);

    // 6️⃣ Responder
    return NextResponse.json({
      success: true,
      tradeId,
      symbol: trade.symbol,
      side,
      entryPrice: trade.entryPrice,
      closePrice,
      quantity: trade.quantity,
      profit: profit.toFixed(2),
      status: "closed",
    });
  } catch (error) {
    console.error("❌ Error cerrando operación:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
