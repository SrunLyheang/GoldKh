import Decimal from "decimal.js";
import { classifyEntry, type LedgerEntry } from "./ledgerEntry";
import { priceToTroyOz, toTroyOz } from "./units";

export interface Realized {
  realizedUsd: string;
  realizedPercent: string;
  saleCount: number;
}

// Realized gain/loss on gold already sold.
//
// Weighted-average basis like computeHoldings (NOT FIFO): each sell is
// valued at the running average cost at that moment; proceeds are the
// recorded sale price. realized = Σ proceeds − Σ (cost basis of sold qty).
//
// Requires `entries` in chronological order — the running average only
// means anything if buys/sells replay in order.
//
// KHR rows are skipped, so saleCount is USD sells only. realizedPercent is
// against the sold gold's cost basis; "0" until something is sold.
export function computeRealized(entries: LedgerEntry[]): Realized {
  let totalQtyOz = new Decimal(0);
  let totalCostUsd = new Decimal(0);
  let realizedUsd = new Decimal(0);
  let soldCostBasisUsd = new Decimal(0);
  let saleCount = 0;

  for (const entry of entries) {
    const kind = classifyEntry(entry);
    if (kind === "non-usd") continue;

    const qtyOz = new Decimal(toTroyOz(entry.quantity, entry.unit));
    const priceOz = new Decimal(priceToTroyOz(entry.pricePerUnit, entry.unit));

    if (kind === "open-buy") {
      totalCostUsd = totalCostUsd.plus(qtyOz.times(priceOz));
      totalQtyOz = totalQtyOz.plus(qtyOz);
      continue;
    }

    // sale — value at current average cost, then draw the position down.
    const avgCost = totalQtyOz.isZero()
      ? new Decimal(0)
      : totalCostUsd.div(totalQtyOz);
    const costBasis = qtyOz.times(avgCost);
    const proceeds = qtyOz.times(priceOz);

    realizedUsd = realizedUsd.plus(proceeds.minus(costBasis));
    soldCostBasisUsd = soldCostBasisUsd.plus(costBasis);
    saleCount += 1;

    totalCostUsd = totalCostUsd.minus(costBasis);
    totalQtyOz = totalQtyOz.minus(qtyOz);
  }

  return {
    realizedUsd: realizedUsd.toString(),
    realizedPercent: soldCostBasisUsd.isZero()
      ? "0"
      : realizedUsd.div(soldCostBasisUsd).times(100).toString(),
    saleCount,
  };
}
