import { relations } from "drizzle-orm/relations";
import { user, account, session, transactions } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	transactions: many(transactions),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const transactionsRelations = relations(transactions, ({one}) => ({
	user: one(user, {
		fields: [transactions.userId],
		references: [user.id]
	}),
}));