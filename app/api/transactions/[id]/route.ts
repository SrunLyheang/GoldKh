import { auth } from "@clerk/nextjs/server";
import { apiError, apiOk } from "@/lib/api/response";
import { isRateLimited } from "@/lib/api/rateLimit";
import {
  deleteOwnedTransaction,
  updateOwnedTransaction,
} from "@/lib/db/queries/transactions";
import { transactionInputSchema } from "@/lib/validation/transaction";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return apiError("UNAUTHORIZED", "Sign in required", 401);
  }

  if (await isRateLimited(userId)) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests — please slow down and try again shortly",
      429
    );
  }

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return apiError("UNAUTHORIZED", "Sign in required", 401);
  }

  if (await isRateLimited(userId)) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests — please slow down and try again shortly",
      429
    );
  }

  const { id } = await params;
  const deleted = await deleteOwnedTransaction(userId, id);
  if (!deleted) {
    return apiError("NOT_FOUND", "Transaction not found", 404);
  }

  return apiOk({ id: deleted.id });
}
