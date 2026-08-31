import { and, desc, eq, inArray } from "drizzle-orm";
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

type TransactionRow = typeof transactions.$inferSelect;

// Result of a mutation scoped to the session user: `ok` when their row was
// written, `forbidden` when the row exists under another user, `not_found`
// when no such row exists.
export type OwnedMutation<T> =
  | { ok: true; value: T }
  | { ok: false; reason: "forbidden" | "not_found" };

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

// Runs only when an ownership-scoped write matched nothing: "someone else's
// row" (forbidden) vs "no row at all" (not_found). A concurrent delete
// between the write and this lookup just yields not_found — acceptable.
async function classifyMiss(
  id: string
): Promise<{ ok: false; reason: "forbidden" | "not_found" }> {
  const [row] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.id, id));
  return { ok: false, reason: row ? "forbidden" : "not_found" };
}

export async function updateOwnedTransaction(
  userId: string,
  id: string,
  input: NewTransactionInput
): Promise<OwnedMutation<TransactionRow>> {
  const [updated] = await db
    .update(transactions)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  return updated ? { ok: true, value: updated } : classifyMiss(id);
}

export async function deleteOwnedTransaction(
  userId: string,
  id: string
): Promise<OwnedMutation<{ id: string }>> {
  const [deleted] = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  return deleted ? { ok: true, value: deleted } : classifyMiss(id);
}

// Bulk insert for the CSV import path. One multi-row INSERT, so it is
// all-or-nothing: either every row lands or the statement fails and none
// do. The caller (the /api/transactions/bulk route) has already validated
// and capped the list.
export async function createManyTransactionsForUser(
  userId: string,
  inputs: NewTransactionInput[]
) {
  if (inputs.length === 0) return [];
  return db
    .insert(transactions)
    .values(inputs.map((input) => ({ ...input, userId })))
    .returning();
}

// Bulk delete for the transaction list's multi-select action (DELETE
// /api/transactions/bulk). Ownership-scoped in the same statement: ids
// that aren't the caller's — or don't exist — are simply not matched, so
// the returned id list is the source of truth for what was removed and
// the client reconciles against it. The caller has already capped the
// list length.
export async function deleteManyOwnedTransactions(
  userId: string,
  ids: string[]
) {
  if (ids.length === 0) return [];
  return db
    .delete(transactions)
    .where(
      and(eq(transactions.userId, userId), inArray(transactions.id, ids))
    )
    .returning({ id: transactions.id });
}

// Clears every row owned by `userId`. Used by the Clerk `user.deleted`
// webhook (account cleanup) and by the Settings "Delete all transactions"
// action (DELETE /api/transactions).
export async function deleteAllTransactionsForUser(userId: string) {
  return db
    .delete(transactions)
    .where(eq(transactions.userId, userId))
    .returning({ id: transactions.id });
}
