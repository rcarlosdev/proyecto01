// src/modules/auth/services/UserService.ts
import { db } from "@/db";
import { user, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { InferInsertModel } from "drizzle-orm";

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

  static async getUserByEmail(email: string) {
    const result = await db.select().from(user).where(eq(user.email, email));
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
  ) {
    const amountStr = amount.toFixed(2);

    const newTransaction: InferInsertModel<typeof transactions> = {
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
