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

    // Buscar trade por id (string)
    const [trade] = await db
      .select()
      .from(trades)
      .where(eq(trades.id, String(tradeId)));

    if (!trade) {
      return NextResponse.json(
        { success: false, error: "Trade no encontrado" },
        { status: 404 }
      );
    }

    if (trade.status === "closed") {
      return NextResponse.json(
        { success: false, error: "La operación ya está cerrada" },
        { status: 400 }
      );
    }

    const entry = Number(trade.entryPrice ?? 0);
    const qty = Number(trade.quantity ?? 0);
    const leverage = Number(trade.leverage ?? 1);

    // Derivar precio de cierre si no llegó
    const close =
      closePrice && Number(closePrice) > 0
        ? Number(closePrice)
        : Number((entry * (1 + (Math.random() - 0.5) * 0.02)).toFixed(5));

    const side = trade.side === "buy" ? 1 : -1;
    const profit = Number(((close - entry) * qty * leverage * side).toFixed(2));

    // Actualizar trade en BD
    await db
      .update(trades)
      .set({
        closePrice: close.toFixed(4),
        profit: profit.toFixed(2),
        status: "closed",
        closedAt: new Date(),
      })
      .where(eq(trades.id, trade.id));

    // Obtener usuario y balance actual
    const [u] = await db.select().from(user).where(eq(user.id, trade.userId));
    const currentBalance = Number(u?.balance ?? 0);

    // Metadata y margen liberado
    const md =
      typeof trade.metadata === "string"
        ? (() => {
            try {
              return JSON.parse(trade.metadata);
            } catch {
              return {};
            }
          })()
        : trade.metadata || {};

    const releasedMargin = Number(
      md?.marginUsed ?? entry * qty
    ) || 0;

    const newBalance = Number(
      (currentBalance + releasedMargin + profit).toFixed(2)
    );

    // Actualizar balance de usuario
    await db
      .update(user)
      .set({ balance: newBalance.toFixed(2) })
      .where(eq(user.id, trade.userId));

    // Insertar transacción
    await db.insert(transactions).values([
      {
        id: crypto.randomUUID(),
        userId: trade.userId,
        type: "trade_close",
        amount: profit.toFixed(2), // si tu columna es NUMERIC/TEXT, esto va bien
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
      } as any,
    ]);

    const nowIso = new Date().toISOString();

    return NextResponse.json({
      success: true,
      trade: {
        id: trade.id,
        symbol: trade.symbol,
        side: trade.side,
        entryPrice: entry.toFixed(4),
        closePrice: close,          // ⬅️ número en la respuesta
        quantity: qty,
        leverage,
        profit,                     // ⬅️ número
        status: "closed",
        createdAt: trade.createdAt,
        closedAt: nowIso,
        metadata: md,
        // opcional: balance resultante asociado a esta operación
        newBalance,
      },
      newBalance,                    // ⬅️ número global
    });
  } catch (error) {
    console.error("❌ close trade:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
