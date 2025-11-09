// src/db/schema.ts
import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  serial,
  jsonb,
} from "drizzle-orm/pg-core";

/**
 * Tabla de usuarios
 * - Info básica
 * - Roles y estados
 * - Balance
 * - Preferencias en JSON
 */
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),

  // 🔹 Extensiones
  role: text("role").$type<"user" | "admin" | "collaborator">().default("user"),
  status: text("status")
    .$type<"active" | "inactive" | "banned">()
    .default("active"),
  balance: numeric("balance", { precision: 12, scale: 2 }).default("0.00"),

  // 🔹 JSON para configuraciones de usuario
  preferences: jsonb("preferences")
    .$type<{ theme?: string; notifications?: boolean }>()
    .default({}),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .defaultNow()
    .notNull(),
});

/**
 * Tabla de sesiones (BetterAuth)
 * - Enlaza a user
 * - Se puede enriquecer con metadata (JSON)
 */
export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .defaultNow()
    .notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // 🔹 JSON para registrar ubicación o dispositivo
  location: jsonb("location").$type<{ country?: string; city?: string }>(),
});

/**
 * Tabla de cuentas sociales (Google, etc.)
 */
export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .defaultNow()
    .notNull(),
});

/**
 * Tabla de verificaciones (para emails, códigos, etc.)
 */
export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .defaultNow()
    .notNull(),
});

/**
 * Tabla de transacciones financieras
 * - Todas las operaciones quedan registradas (auditoría)
 */
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type")
    .$type<"deposit" | "withdrawal" | "transfer" | "trade">()
    .notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status")
    .$type<"pending" | "completed" | "failed">()
    .default("pending"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});


/** * Tabla de trades
 * - Registra cada operación de trading realizada por los usuarios
 */
export const trades = pgTable("trades", {
  id: text("id").primaryKey(),

  // Relación con el usuario
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Información del trade
  symbol: text("symbol").notNull(),
  side: text("side").$type<"buy" | "sell">().notNull(), // ✅ lado de la operación
  entryPrice: numeric("entry_price", { precision: 12, scale: 4 }).notNull(), // ✅ precio de entrada
  closePrice: numeric("close_price", { precision: 12, scale: 4 }), // ✅ precio de cierre (nullable)
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(), // ✅ cantidad
  leverage: numeric("leverage", { precision: 12, scale: 2 }).default("1"), // ✅ apalancamiento

  // Resultados
  profit: numeric("profit", { precision: 12, scale: 2 }).default("0.00"), // ✅ PnL
  status: text("status").$type<"open" | "closed">().default("open").notNull(),

  // Metadatos flexibles (puedes guardar fees, timestamps, condiciones, etc.)
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),

  // Tiempos
  createdAt: timestamp("created_at").defaultNow().notNull(),
  closedAt: timestamp("closed_at"),
});
