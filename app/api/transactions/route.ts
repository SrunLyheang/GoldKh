import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/api/response";
import {
  createTransactionForUser,
  listTransactionsForUser,
} from "@/lib/db/queries/transactions";

const createTransactionSchema = z.object({
  type: z.enum(["buy", "sell"]),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/, "Invalid quantity"),
  unit: z.enum(["chi", "damlung"]),
  pricePerUnit: z.string().regex(/^\d+(\.\d{1,4})?$/, "Invalid price"),
  currency: z.enum(["USD", "KHR"]),
  transactionDate: z.string().date(),
  notes: z.string().max(500).optional(),
});

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

  const body: unknown = await request.json();
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("INVALID_INPUT", "Invalid transaction payload", 400);
  }

  const created = await createTransactionForUser(userId, parsed.data);
  return apiOk(created, 201);
}
