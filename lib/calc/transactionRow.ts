import Decimal from "decimal.js";
import { priceFromTroyOz, priceToTroyOz, toTroyOz, type GoldUnit } from "./units";

export interface TransactionRowLike {
  type: "buy" | "sell";
  quantity: string;
  unit: GoldUnit;
  pricePerUnit: string;
  currency: "USD" | "KHR";
}

export interface RowValuation {
  pricePerDamlung: string;
  pricePerChi: string;
  amountUsd: string | null;
  currentValueUsd: string | null;
  pnlUsd: string | null;
  pnlPercent: string | null;
}

// Per-row valuation is informational only — "what this specific entry is
// worth today" — and is never fed into the portfolio's aggregate
// holdings/gain-loss figures, which stay weighted-average per
// project-overview.md's "Out of Scope: FIFO or per-lot cost basis" rule.
// A sell row shows what was received, not a current value — there's no
// ongoing position on that entry to value. KHR rows show no USD figures
// since KHR conversion is deferred entirely (project-overview.md).
export function computeRowValuation(
  tx: TransactionRowLike,
  currentPricePerTroyOz: string
): RowValuation {
  const priceTroyOz = priceToTroyOz(tx.pricePerUnit, tx.unit);
  const pricePerDamlung = priceFromTroyOz(priceTroyOz, "damlung");
  const pricePerChi = priceFromTroyOz(priceTroyOz, "chi");

  if (tx.currency !== "USD") {
    return {
      pricePerDamlung,
      pricePerChi,
      amountUsd: null,
      currentValueUsd: null,
      pnlUsd: null,
      pnlPercent: null,
    };
  }

  const amountUsd = new Decimal(tx.quantity).times(tx.pricePerUnit).toString();

  if (tx.type === "sell") {
    return {
      pricePerDamlung,
      pricePerChi,
      amountUsd,
      currentValueUsd: null,
      pnlUsd: null,
      pnlPercent: null,
    };
  }

  const qtyOz = new Decimal(toTroyOz(tx.quantity, tx.unit));
  const currentValueUsd = qtyOz.times(currentPricePerTroyOz).toString();
  const pnlUsd = new Decimal(currentValueUsd).minus(amountUsd).toString();
  const pnlPercent = new Decimal(amountUsd).isZero()
    ? "0"
    : new Decimal(pnlUsd).div(amountUsd).times(100).toString();

  return {
    pricePerDamlung,
    pricePerChi,
    amountUsd,
    currentValueUsd,
    pnlUsd,
    pnlPercent,
  };
}
