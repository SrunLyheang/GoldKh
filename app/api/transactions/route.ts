import { apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/parseJsonBody";
import { assertSameOrigin } from "@/lib/api/sameOrigin";
import { withAuth, withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";
import {
  createTransactionForUser,
  deleteAllTransactionsForUser,
  listTransactionsForUser,
} from "@/lib/db/queries/transactions";
import { transactionInputSchema } from "@/lib/validation/transaction";

export const GET = withAuth(async (_request, { userId }) => {
  const rows = await listTransactionsForUser(userId);
  return apiOk(rows);
});

export const POST = withAuthAndRateLimit(async (request, { userId }) => {
  const body = await parseJsonBody(
    request,
    transactionInputSchema,
    "transaction payload"
  );
  if (!body.ok) {
    return body.response;
  }

  const created = await createTransactionForUser(userId, body.data);
  return apiOk(created, 201);
});

// Wipes every transaction owned by the caller — the Settings "Delete all
// transactions" action. Session-scoped,
// rate limited, same-origin only.
export const DELETE = withAuthAndRateLimit(async (request, { userId }) => {
  const crossOrigin = assertSameOrigin(request);
  if (crossOrigin) return crossOrigin;

  const deleted = await deleteAllTransactionsForUser(userId);
  return apiOk({ deleted: deleted.length });
});
