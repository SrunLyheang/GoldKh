import Decimal from "decimal.js";
import { classifyEntry, type LedgerEntry } from "./ledgerEntry";
import type { GoldUnit } from "./units";

export interface DatedLedgerEntry extends LedgerEntry {
  transactionDate: string;
}

export interface LargestBuy {
  quantity: string;
  unit: GoldUnit;
  transactionDate: string;
  amountUsd: string;
}

export interface InsightsAggregates {
  // Σ (quantity × pricePerUnit) over USD buys — cumulative, sells don't
  // reduce it ("You've put in $X across N buys").
  totalInvestedUsd: string;
  buyCount: number;
  // The single biggest USD buy by amount, or null when there are none.
  largestBuy: LargestBuy | null;
}

// The two Insights readout aggregates that aren't already covered by
// computeHoldings / computeGainLoss / computeRealized.
// Pure. KHR buys are excluded, the
// same rule the rest of the calc layer applies (classifyEntry).
export function computeInsights(
  transactions: DatedLedgerEntry[],
): InsightsAggregates {
  let totalInvested = new Decimal(0);
  let buyCount = 0;
  let largestBuy: LargestBuy | null = null;
  let largestAmount = new Decimal(0);

  for (const tx of transactions) {
    if (classifyEntry(tx) !== "open-buy") continue;

    const amount = new Decimal(tx.quantity).times(tx.pricePerUnit);
    totalInvested = totalInvested.plus(amount);
    buyCount += 1;

    if (largestBuy === null || amount.greaterThan(largestAmount)) {
      largestAmount = amount;
      largestBuy = {
        quantity: tx.quantity,
        unit: tx.unit,
        transactionDate: tx.transactionDate,
        amountUsd: amount.toString(),
      };
    }
  }

  return {
    totalInvestedUsd: totalInvested.toString(),
    buyCount,
    largestBuy,
  };
}
