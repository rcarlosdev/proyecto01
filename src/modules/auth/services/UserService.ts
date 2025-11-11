// src/modules/auth/services/UserService.ts
import { db } from "@/db";
import { user, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

// Helper universal para UUID (Edge y Node)
function genUUID(): string {
  // Web Crypto disponible en Edge y también en Node 18+ como globalThis.crypto
  if (typeof globalThis !== "undefined" && globalThis.crypto && "randomUUID" in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }
  // Fallback muy simple si por alguna razón no existe (no debería ocurrir en Edge)
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}-${Math.random()
    .toString(16)
    .slice(2, 10)}`;
}

export class UserService {
  static async createUser(data: {
    id: string;
    name: string;
    email: string;
    role?: "user" | "admin" | "collaborator";
  }) {
    const newUser = await db
      .insert(user)
      .values({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role ?? "user",
      })
      .returning();
    return newUser[0];
  }

  static async getUserById(userId: string) {
    const result = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    return result[0] ?? null;
  }

  static async getUserByEmail(email: string) {
    const result = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return result[0] ?? null;
  }

  static async updateRole(userId: string, role: "user" | "admin" | "collaborator") {
    await db.update(user).set({ role }).where(eq(user.id, userId));
  }

  static async updateStatus(
    userId: string,
    status: "active" | "inactive" | "banned"
  ) {
    await db.update(user).set({ status }).where(eq(user.id, userId));
  }

  static async adjustBalance(
    userId: string,
    amount: number,
    type: "deposit" | "withdrawal" | "transfer" | "trade"
  ): Promise<any> {
    const amountStr = amount.toFixed(2);

    const newTransaction: InferInsertModel<typeof transactions> = {
      id: genUUID(), // ✅ Edge-safe
      userId: String(userId),
      type,
      amount: amountStr,
      status: "completed",
    };

    const trx = await db.insert(transactions).values(newTransaction).returning();

    await db
      .update(user)
      .set({
        balance: sql`(COALESCE(${user.balance}::numeric, 0) + ${amount})::numeric`,
      })
      .where(eq(user.id, userId));

    return trx[0];
  }

  static async getTransactions(userId: string) {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
  }
}
