import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import { assertSameOrigin } from "@/lib/api/sameOrigin";
import { withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";
import {
  createManyTransactionsForUser,
  deleteManyOwnedTransactions,
} from "@/lib/db/queries/transactions";
import { MAX_BULK_ROWS } from "@/lib/constants/csv";
import { transactionInputSchema } from "@/lib/validation/transaction";

const bulkSchema = z.object({
  transactions: z.array(transactionInputSchema).min(1),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

// POST /api/transactions/bulk — insert every row from a validated CSV
// import in one all-or-nothing statement. One rate-limit token for the
// whole batch. On a per-row schema failure the response carries an
// `issues` list (index + message) alongside the standard `error` object
// so the import dialog can keep the bad rows in its preview.
export const POST = withAuthAndRateLimit(async (request, { userId }) => {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("INVALID_INPUT", "Request body must be valid JSON", 400);
  }

  if (
    typeof raw === "object" &&
    raw !== null &&
    Array.isArray((raw as { transactions?: unknown }).transactions) &&
    (raw as { transactions: unknown[] }).transactions.length > MAX_BULK_ROWS
  ) {
    return apiError(
      "TOO_MANY_ROWS",
      `Import up to ${MAX_BULK_ROWS} rows at a time`,
      400
    );
  }

  const parsed = bulkSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => {
        const [, index] = issue.path;
        return typeof index === "number"
          ? { index, message: issue.message }
          : null;
      })
      .filter((i): i is { index: number; message: string } => i !== null);
    return NextResponse.json(
      {
        error: { code: "INVALID_INPUT", message: "Invalid transaction rows" },
        issues,
      },
      { status: 400 }
    );
  }

  const created = await createManyTransactionsForUser(
    userId,
    parsed.data.transactions
  );
  return apiOk({ inserted: created.length }, 201);
});

// DELETE /api/transactions/bulk — remove a batch of the caller's rows in
// one ownership-scoped statement, for the transaction list's multi-select
// action. One rate-limit token for the whole batch. Ids that aren't the
// caller's are silently skipped; `deleted` reports how many rows actually
// went so the client can reconcile its optimistic removal.
export const DELETE = withAuthAndRateLimit(async (request, { userId }) => {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return apiError("INVALID_INPUT", "Request body must be valid JSON", 400);
  }

  if (
    typeof raw === "object" &&
    raw !== null &&
    Array.isArray((raw as { ids?: unknown }).ids) &&
    (raw as { ids: unknown[] }).ids.length > MAX_BULK_ROWS
  ) {
    return apiError(
      "TOO_MANY_ROWS",
      `Delete up to ${MAX_BULK_ROWS} rows at a time`,
      400
    );
  }

  const parsed = bulkDeleteSchema.safeParse(raw);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", "Expected a non-empty list of ids", 400);
  }

  const deleted = await deleteManyOwnedTransactions(userId, parsed.data.ids);
  return apiOk({ deleted: deleted.length });
});
