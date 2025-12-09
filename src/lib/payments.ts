import { db } from "@/db";
import { eq } from "drizzle-orm";
import { payments } from "@/db/schema"; // ruta a tu schema Drizzle
import crypto from "crypto";

export function genId() {
  return crypto.randomUUID();
}

export async function createPendingPayment(payload: {
  referenceId: string;
  provider: string;
  checkoutUrl?: string | null;
  amount: number;
  currency: string;
  userId: string;
  customerEmail?: string | null;
  providerRequest?: any;
}) {
  const id = genId();
  await db.insert(payments).values({
    id,
    referenceId: payload.referenceId,
    provider: payload.provider,
    providerPaymentId: null,
    checkoutUrl: payload.checkoutUrl ?? null,
    amount: payload.amount.toString(),
    currency: payload.currency,
    status: "pending",
    customerEmail: payload.customerEmail ?? null,
    userId: payload.userId,
    providerRequest: payload.providerRequest ?? null,
    providerWebhook: null,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  return id;
}

export async function updatePaymentOnWebhook(referenceId: string, updates: Record<string, any>) {
  await db.update(payments).set({
    ...updates,
    updatedAt: new Date()
  }).where(eq(payments.referenceId, referenceId));
}

export async function findPaymentByReference(referenceId: string) {
  const [row] = await db.select().from(payments).where(eq(payments.referenceId, referenceId)).limit(1);
  return row ?? null;
}
