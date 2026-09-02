import { z } from "zod";

// The smallest amount a user is allowed to log, in chi. 0.01 chi is
// ~0.0375 g — below this is almost certainly a typo, not a real holding.
// Checked in chi-equivalent regardless of the unit the user picked.
export const MIN_QUANTITY_CHI = 0.01;
const MIN_QUANTITY_DAMLUNG = MIN_QUANTITY_CHI / 10;

// Upper bounds on the two amount fields. Anything past these is a fat-finger
// or a mangled CSV cell, not a real entry. They also keep a derived
// `pricePerUnit` (total_paid / quantity, from a CSV import) inside the
// numeric(14,4) / numeric(12,4) columns, so an oversized row fails per-row
// in the import preview instead of aborting the all-or-nothing bulk insert
// with a Postgres numeric-overflow.
export const MAX_PRICE_PER_UNIT = 1_000_000_000;
export const MAX_QUANTITY = 100_000_000;

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
  quantityTooLarge: "That amount is too large — check the value.",
  priceTooLarge: "That price is too large — check the value.",
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
  opts: {
    notPositiveMessage: string;
    min?: number;
    minMessage?: string;
    max?: number;
    maxMessage?: string;
  }
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
  if (opts.max !== undefined && n > opts.max) {
    add(opts.maxMessage!);
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
      max: MAX_QUANTITY,
      maxMessage: transactionMessages.quantityTooLarge,
    });
    checkAmount(value.pricePerUnit, ctx, "pricePerUnit", {
      notPositiveMessage: transactionMessages.priceNotPositive,
      max: MAX_PRICE_PER_UNIT,
      maxMessage: transactionMessages.priceTooLarge,
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
