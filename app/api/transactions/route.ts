import { auth } from "@clerk/nextjs/server";
import { apiError, apiOk } from "@/lib/api/response";
import { isRateLimited } from "@/lib/api/rateLimit";
import {
  createTransactionForUser,
  listTransactionsForUser,
} from "@/lib/db/queries/transactions";
import { transactionInputSchema } from "@/lib/validation/transaction";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return apiError("UNAUTHORIZED", "Sign in required", 401);
  }

  const rows = await listTransactionsForUser(userId);
  return apiOk(rows);
}

export async function POST(request: Request) {
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

  const created = await createTransactionForUser(userId, parsed.data);
  return apiOk(created, 201);
}
