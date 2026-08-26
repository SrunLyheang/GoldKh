import { auth } from "@clerk/nextjs/server";
import { apiError, apiOk } from "@/lib/api/response";
import { deleteOwnedTransaction } from "@/lib/db/queries/transactions";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return apiError("UNAUTHORIZED", "Sign in required", 401);
  }

  const { id } = await params;
  const deleted = await deleteOwnedTransaction(userId, id);
  if (!deleted) {
    return apiError("NOT_FOUND", "Transaction not found", 404);
  }

  return apiOk({ id: deleted.id });
}
