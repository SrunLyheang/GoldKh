import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { transactions } from "@/lib/db/schema";

export interface NewTransactionInput {
  type: "buy" | "sell";
  quantity: string;
  unit: "chi" | "damlung";
  pricePerUnit: string;
  currency: "USD" | "KHR";
  transactionDate: string;
  notes?: string;
}

export async function listTransactionsForUser(userId: string) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.transactionDate));
}

export async function createTransactionForUser(
  userId: string,
  input: NewTransactionInput
) {
  const [created] = await db
    .insert(transactions)
    .values({ ...input, userId })
    .returning();
  return created;
}

// Enforces ownership: a row must belong to userId to be returned, matching
// code-standards.md's rule that ownership is confirmed before any mutation
// rather than merely referenced by a client-supplied ID.
export async function getOwnedTransaction(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)));
  return row;
}

// Same ownership-scoped WHERE as deleteOwnedTransaction — a row is updated
// only if it belongs to userId. Full replace, not a partial patch: every
// field in NewTransactionInput is written, matching the same schema POST
// validates against.
export async function updateOwnedTransaction(
  userId: string,
  id: string,
  input: NewTransactionInput
) {
  const [updated] = await db
    .update(transactions)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  return updated;
}

// The WHERE clause carries the same ownership check as getOwnedTransaction
// — a row is deleted only if it belongs to userId, never merely referenced
// by a client-supplied ID.
export async function deleteOwnedTransaction(userId: string, id: string) {
  const [deleted] = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  return deleted;
}
