import { apiError, apiOk } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/parseJsonBody";
import { withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";
import {
  deleteOwnedTransaction,
  updateOwnedTransaction,
} from "@/lib/db/queries/transactions";
import { transactionInputSchema } from "@/lib/validation/transaction";

type RouteContext = { params: Promise<{ id: string }> };

function ownershipError(reason: "forbidden" | "not_found") {
  return reason === "forbidden"
    ? apiError("FORBIDDEN", "You don't have access to this transaction", 403)
    : apiError("NOT_FOUND", "Transaction not found", 404);
}

export const PATCH = withAuthAndRateLimit<RouteContext>(
  async (request, { userId, params }) => {
    const body = await parseJsonBody(
      request,
      transactionInputSchema,
      "transaction payload"
    );
    if (!body.ok) {
      return body.response;
    }

    const { id } = await params;
    const result = await updateOwnedTransaction(userId, id, body.data);
    if (!result.ok) {
      return ownershipError(result.reason);
    }

    return apiOk(result.value);
  }
);

export const DELETE = withAuthAndRateLimit<RouteContext>(
  async (_request, { userId, params }) => {
    const { id } = await params;
    const result = await deleteOwnedTransaction(userId, id);
    if (!result.ok) {
      return ownershipError(result.reason);
    }

    return apiOk({ id: result.value.id });
  }
);
