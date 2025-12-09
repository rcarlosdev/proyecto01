import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const headerList = await headers();

  const signature = headerList.get("x-hotmart-signature") ?? "";
  const webhookSecret = process.env.HOTMART_WEBHOOK_SECRET!;

  // 1. Verificar firma HMAC (Hotmart usa SHA256)
  const computedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(body)
    .digest("hex");

  if (computedSignature !== signature) {
    console.error("❌ Firma de webhook inválida");
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // 2. Parsear JSON del webhook
  let event: any;
  try {
    event = JSON.parse(body);
  } catch (err) {
    console.error("❌ Error parseando JSON del webhook:", err);
    return new NextResponse("Error parsing JSON", { status: 400 });
  }

  console.log("📩 Webhook Hotmart recibido:", event);

  const hotmartStatus = event?.status;
  const referenceId = event?.purchase?.product?.id || event?.purchase?.id;

  if (!referenceId) {
    console.error("⚠️ Webhook sin referenceId válido");
    return new NextResponse("Missing referenceId", { status: 400 });
  }

  try {
    // 3. Buscar payment original por referenceId
    const [paymentRow] = await db
      .select()
      .from(payments)
      .where(eq(payments.referenceId, referenceId));

    if (!paymentRow) {
      console.warn("⚠️ Payment no encontrado para referenceId:", referenceId);
      return NextResponse.json({ ok: true });
    }

    console.log("➡️ Payment encontrado:", {
      id: paymentRow.id,
      status: paymentRow.status,
      userId: paymentRow.userId,
    });

    // 4. Mapear estados Hotmart → internos
    const statusMap: Record<string, string> = {
      approved: "paid",
      completed: "paid",
      refunded: "refunded",
      chargeback: "chargeback",
      canceled: "canceled",
      delayed: "pending",
      started: "pending",
    };

    const newStatus = statusMap[hotmartStatus] || "pending";

    // Idempotencia
    if (paymentRow.status === newStatus) {
      console.log("ℹ️ Estado ya actualizado, se ignora");
      return NextResponse.json({ ok: true });
    }

    // 5. Actualizar tabla payments (sin acreditaciones)
    await db
      .update(payments)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, paymentRow.id));

    console.log("✅ Payment actualizado:", {
      paymentId: paymentRow.id,
      nuevoEstado: newStatus,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Error procesando webhook:", err);
    return new NextResponse("Webhook handler error", { status: 500 });
  }
}
