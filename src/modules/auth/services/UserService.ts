// src/modules/auth/services/UserService.ts
import { db } from "@/db";
import { user, transactions } from "@/db/schema";
// import { eq, and } from "drizzle-orm";
import { eq } from "drizzle-orm";

export class UserService {
  /**
   * Crear un nuevo usuario
   */
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

  /**
   * Buscar usuario por email
   */
  static async getUserByEmail(email: string) {
    const result = await db.select().from(user).where(eq(user.email, email));
    return result[0] ?? null;
  }

  /**
   * Actualizar rol de usuario
   */
  static async updateRole(userId: string, role: "user" | "admin" | "collaborator") {
    await db.update(user).set({ role }).where(eq(user.id, userId));
  }

  /**
   * Cambiar estado de usuario
   */
  static async updateStatus(
    userId: string,
    status: "active" | "inactive" | "banned"
  ) {
    await db.update(user).set({ status }).where(eq(user.id, userId));
  }

  /**
   * Ajustar saldo (abono o retiro)
   */
  static async adjustBalance(userId: string, amount: number, type: "deposit" | "withdrawal" | "transfer" | "trade") {
    // 🔹 Registrar transacción
    const trx = await db
      .insert(transactions)
      .values({
        userId,
        type,
        amount,
        status: "completed",
      })
      .returning();

    // 🔹 Ajustar saldo
    await db.execute(`
      UPDATE "user"
      SET balance = balance::numeric + ${amount}
      WHERE id = '${userId}'
    `);

    return trx[0];
  }

  /**
   * Obtener historial de transacciones
   */
  static async getTransactions(userId: string) {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
  }
}
