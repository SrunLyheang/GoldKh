import Decimal from "decimal.js";
import type { PriceSnapshotPoint } from "./portfolioSeries";
import { priceFromTroyOz, type GoldUnit } from "./units";

export interface BuyQualityTxInput {
  type: "buy" | "sell";
  quantity: string;
  unit: GoldUnit;
  pricePerUnit: string;
  currency: "USD" | "KHR";
  transactionDate: string;
}

export interface BuyQualityRow {
  type: "buy";
  transactionDate: string;
  quantity: string;
  unit: GoldUnit;
  // quantity × pricePerUnit.
  paidUsd: string;
  pricePerUnitUsd: string;
  // Spot price for this row's unit on the buy date (nearest snapshot
  // at/before it), or null when no snapshot is that old.
  spotPerUnitUsd: string | null;
  // (spot − price) / price × 100 — positive means bought below spot, the
  // favorable case. Same denominator convention as computeGainLoss
  // (relative to what was paid). null when spot is unknown.
  vsSpotPercent: string | null;
}

// Per-buy quality: how each purchase priced against spot on the day it
// was made. USD buys only — sells have no ongoing position to grade and
// KHR conversion is deferred (CONTEXT.md invariant 4), the same rule
// classifyEntry encodes. Pure: no
// I/O. Input order of the buys is preserved; the UI does the sorting.
export function computeBuyQuality(
  transactions: BuyQualityTxInput[],
  snapshots: PriceSnapshotPoint[],
): BuyQualityRow[] {
  const ordered = [...snapshots].sort((a, b) => a.t - b.t);

  return transactions
    .filter((tx) => tx.type === "buy" && tx.currency === "USD")
    .map((tx) => {
      const paidUsd = new Decimal(tx.quantity)
        .times(tx.pricePerUnit)
        .toString();
      // End of the buy day, matching spotPerDamlungOnDate's cutoff.
      const buyTime = new Date(`${tx.transactionDate}T23:59:59.999Z`).getTime();

      let nearest: PriceSnapshotPoint | undefined;
      for (const snapshot of ordered) {
        if (snapshot.t <= buyTime) {
          nearest = snapshot;
        } else {
          break;
        }
      }

      const spotPerUnitUsd = nearest
        ? priceFromTroyOz(nearest.pricePerTroyOz, tx.unit)
        : null;
      const vsSpotPercent =
        spotPerUnitUsd !== null
          ? new Decimal(spotPerUnitUsd)
              .minus(tx.pricePerUnit)
              .div(tx.pricePerUnit)
              .times(100)
              .toString()
          : null;

      return {
        type: "buy" as const,
        transactionDate: tx.transactionDate,
        quantity: tx.quantity,
        unit: tx.unit,
        paidUsd,
        pricePerUnitUsd: tx.pricePerUnit,
        spotPerUnitUsd,
        vsSpotPercent,
      };
    });
}
