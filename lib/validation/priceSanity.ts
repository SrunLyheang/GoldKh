// A fat-finger guard, not a security boundary: the transaction dialog
// runs this on the *derived per-unit* price (total paid ÷ quantity)
// against the current spot price for the selected unit, both in USD.
// Per-unit price is quantity-independent, so a large purchase never
// trips it; the band is wide enough that a future price rise or a
// genuinely bad deal still saves. Only an extra zero or a wrong unit is
// meant to be caught.
//
// - Hard verdict — outside 0.1× – 10× spot — the dialog gates submit.
// - Soft verdict — outside 0.5× – 2× spot — informational only.
//
// The server keeps its own `> 0` + 4-dp check; spot isn't available
// server-side without a DB read, so this stays client-only.
export type PriceVerdict =
  | "ok"
  | "soft-low"
  | "soft-high"
  | "hard-low"
  | "hard-high";

const HARD_LOW = 0.1;
const SOFT_LOW = 0.5;
const SOFT_HIGH = 2;
const HARD_HIGH = 10;

// Both arguments are per-unit USD prices for the same unit (chi or
// damlung). Returns "ok" when either input is missing, non-positive, or
// non-finite — there's nothing meaningful to compare, and the schema's
// own validation covers a bad price.
export function classifyPrice(
  perUnitUsd: number,
  spotPerUnitUsd: number
): PriceVerdict {
  if (
    !Number.isFinite(perUnitUsd) ||
    !Number.isFinite(spotPerUnitUsd) ||
    perUnitUsd <= 0 ||
    spotPerUnitUsd <= 0
  ) {
    return "ok";
  }

  const ratio = perUnitUsd / spotPerUnitUsd;

  if (ratio < HARD_LOW) return "hard-low";
  if (ratio > HARD_HIGH) return "hard-high";
  if (ratio < SOFT_LOW) return "soft-low";
  if (ratio > SOFT_HIGH) return "soft-high";
  return "ok";
}

export function isHardVerdict(verdict: PriceVerdict): boolean {
  return verdict === "hard-low" || verdict === "hard-high";
}

export function isSoftVerdict(verdict: PriceVerdict): boolean {
  return verdict === "soft-low" || verdict === "soft-high";
}
