import { z } from "zod";

// The smallest amount a user is allowed to log, in chi. 0.01 chi is
// ~0.0375 g — below this is almost certainly a typo, not a real holding.
// Checked in chi-equivalent regardless of the unit the user picked.
export const MIN_QUANTITY_CHI = 0.01;
const MIN_QUANTITY_DAMLUNG = MIN_QUANTITY_CHI / 10;

// User-facing validation copy. Kept as literals here (not routed through
// the i18n dictionary) because the schema runs on the server too, where
// there is no locale context — matches the pre-existing pattern of inline
// messages on this schema. Only English ships right now.
export const transactionMessages = {
  notANumber: "Enter a number, like 2.5.",
  tooManyDecimals: "Use at most 4 decimal places.",
  quantityNotPositive: "Enter an amount greater than zero.",
  quantityTooSmall: `The smallest amount you can log is ${MIN_QUANTITY_CHI} chi.`,
  priceNotPositive: "Enter a price greater than zero.",
  dateInvalid: "Enter a valid date.",
  dateInFuture: "The date can't be in the future.",
  notesTooLong: "Notes can't be longer than 500 characters.",
} as const;

function decimalPlaces(value: string): number {
  const dot = value.indexOf(".");
  return dot === -1 ? 0 : value.length - dot - 1;
}

// Ordered checks for a decimal-string amount: format, then scale, then
// sign, then (optionally) a lower bound. Stops at the first failure so the
// user sees one message per field, not a stack.
function checkAmount(
  value: string,
  ctx: z.RefinementCtx,
  path: string,
  opts: { notPositiveMessage: string; min?: number; minMessage?: string }
): void {
  const add = (message: string) =>
    ctx.addIssue({ code: "custom", message, path: [path] });

  // Normalise once: surrounding whitespace must not count toward the
  // decimal-place tally or the numeric parse.
  const normalized = value.trim();

  if (!/^\d*\.?\d+$/.test(normalized)) {
    add(transactionMessages.notANumber);
    return;
  }
  if (decimalPlaces(normalized) > 4) {
    add(transactionMessages.tooManyDecimals);
    return;
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    add(opts.notPositiveMessage);
    return;
  }
  if (opts.min !== undefined && n < opts.min) {
    add(opts.minMessage!);
  }
}

// Latest date a transaction may be dated: server "today" in UTC plus one
// day of slack, so a user in UTC+7 logging something "today" their time
// isn't rejected for the few hours it reads as tomorrow in UTC.
function maxTransactionDateKey(now = new Date()): string {
  const max = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return max.toISOString().slice(0, 10);
}

// Shared by POST (create) and PATCH (edit) — both write the full row, so
// both validate against the identical shape.
export const transactionInputSchema = z
  .object({
    type: z.enum(["buy", "sell"]),
    quantity: z.string(),
    unit: z.enum(["chi", "damlung"]),
    pricePerUnit: z.string(),
    currency: z.enum(["USD", "KHR"]),
    transactionDate: z.string().date(transactionMessages.dateInvalid),
    notes: z.string().max(500, transactionMessages.notesTooLong).optional(),
  })
  .superRefine((value, ctx) => {
    checkAmount(value.quantity, ctx, "quantity", {
      notPositiveMessage: transactionMessages.quantityNotPositive,
      min: value.unit === "chi" ? MIN_QUANTITY_CHI : MIN_QUANTITY_DAMLUNG,
      minMessage: transactionMessages.quantityTooSmall,
    });
    checkAmount(value.pricePerUnit, ctx, "pricePerUnit", {
      notPositiveMessage: transactionMessages.priceNotPositive,
    });
    if (
      /^\d{4}-\d{2}-\d{2}$/.test(value.transactionDate) &&
      value.transactionDate > maxTransactionDateKey()
    ) {
      ctx.addIssue({
        code: "custom",
        message: transactionMessages.dateInFuture,
        path: ["transactionDate"],
      });
    }
  });
