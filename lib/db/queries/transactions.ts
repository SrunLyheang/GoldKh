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

// Called only from the Clerk `user.deleted` webhook — clears rows left
// behind by a deleted account.
export async function deleteAllTransactionsForUser(userId: string) {
  return db
    .delete(transactions)
    .where(eq(transactions.userId, userId))
    .returning({ id: transactions.id });
}
