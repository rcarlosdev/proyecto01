import { NextResponse } from "next/server";
import { db } from "@/db";
import { trades, user, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { userId, symbol, side, entryPrice, quantity, leverage = 1 } = await req.json();

    if (!userId || !symbol || !side || !entryPrice || !quantity) {
      return NextResponse.json(
        { success: false, error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // 1️⃣ Obtener información del usuario
    const [userData] = await db.select().from(user).where(eq(user.id, userId));

    if (!userData) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // 2️⃣ Calcular el margen usado (simplificado)
    const price = parseFloat(entryPrice);
    const qty = parseFloat(quantity);
    const lev = parseFloat(leverage);
    const marginUsed = (price * qty) / lev;

    if (parseFloat(userData.balance ?? "0") < marginUsed) {
      return NextResponse.json(
        { success: false, error: "Saldo insuficiente para abrir la operación" },
        { status: 400 }
      );
    }

    // 3️⃣ Crear el trade
    const [newTrade] = await db
      .insert(trades)
      .values({
        id: crypto.randomUUID(), // ✅ genera ID único
        userId,
        symbol,
        side,
        entryPrice,
        closePrice: null, // ✅ evita error de columna sin default
        quantity,
        leverage,
        status: "open",
        metadata: { marginUsed },
      })
      .returning();

    // 4️⃣ Actualizar el balance del usuario
    const newBalance = parseFloat(userData.balance ?? "0") - marginUsed;

    await db
      .update(user)
      .set({ balance: newBalance.toFixed(2) })
      .where(eq(user.id, userId));

    // 5️⃣ Registrar transacción del trade
    await db.insert(transactions).values({
      id: crypto.randomUUID(), // ✅ también agregamos ID único aquí
      userId: userId as any,
      type: "trade",
      amount: (-marginUsed).toFixed(2),
      status: "completed",
      metadata: {
        symbol,
        side,
        entryPrice,
        quantity,
        leverage,
        marginUsed,
      } as any,
    } as any);

    // 6️⃣ Devolver respuesta
    return NextResponse.json({
      success: true,
      trade: {
        ...newTrade,
        marginUsed: marginUsed.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
      },
    });
  } catch (error) {
    console.error("❌ Error abriendo operación:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
