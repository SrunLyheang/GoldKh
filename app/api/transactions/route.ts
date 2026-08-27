import { apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/parseJsonBody";
import { withAuth, withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";
import {
  createTransactionForUser,
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
