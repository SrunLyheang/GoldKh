import { apiError, apiOk } from "@/lib/api/response";
import { withAuthAndRateLimit } from "@/lib/api/withAuthAndRateLimit";
import {
  deleteOwnedTransaction,
  updateOwnedTransaction,
} from "@/lib/db/queries/transactions";
import { transactionInputSchema } from "@/lib/validation/transaction";

type RouteContext = { params: Promise<{ id: string }> };

export const PATCH = withAuthAndRateLimit<RouteContext>(
  async (request, { userId, params }) => {
    const body: unknown = await request.json();
    const parsed = transactionInputSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "Invalid transaction payload", 400);
    }

    const { id } = await params;
    const updated = await updateOwnedTransaction(userId, id, parsed.data);
    if (!updated) {
      return apiError("NOT_FOUND", "Transaction not found", 404);
    }

    return apiOk(updated);
  }
);

export const DELETE = withAuthAndRateLimit<RouteContext>(
  async (_request, { userId, params }) => {
    const { id } = await params;
    const deleted = await deleteOwnedTransaction(userId, id);
    if (!deleted) {
      return apiError("NOT_FOUND", "Transaction not found", 404);
    }

    return apiOk({ id: deleted.id });
  }
);
