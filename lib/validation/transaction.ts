import { z } from "zod";

// Shared by POST (create) and PATCH (edit) — both write the full row, so
// both validate against the identical shape.
export const transactionInputSchema = z.object({
  type: z.enum(["buy", "sell"]),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/, "Invalid quantity"),
  unit: z.enum(["chi", "damlung"]),
  pricePerUnit: z.string().regex(/^\d+(\.\d{1,4})?$/, "Invalid price"),
  currency: z.enum(["USD", "KHR"]),
  transactionDate: z.string().date(),
  notes: z.string().max(500).optional(),
});
