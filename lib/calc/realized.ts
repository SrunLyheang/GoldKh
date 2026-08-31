import Decimal from "decimal.js";
import { classifyEntry, type LedgerEntry } from "./ledgerEntry";
import { priceToTroyOz, toTroyOz } from "./units";

export interface Realized {
  realizedUsd: string;
  realizedPercent: string;
  saleCount: number;
}

// Realized gain/loss on gold the user has already sold — the "what I paid
// minus what I sold it for" figure.
//
// Same weighted-average basis as computeHoldings (NOT FIFO — see
// project-overview.md): each sell is
// valued at the running average cost of the position at the moment of
// that sell, and proceeds are the recorded sale price.
//
//   realized = Σ proceeds − Σ (cost basis of the sold quantity)
//
// Depends on `entries` being in chronological order, exactly like
// computeHoldings — the running average is only meaningful if buys and
// sells are replayed in the order they happened.
//
// KHR rows are skipped, not converted (architecture.md invariant 4), so
// saleCount counts USD sells only. realizedPercent is against the cost
// basis of the sold gold, and is "0" until something comparable is sold.
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

    // sale — value it at the average cost of the position right now,
    // then draw the position down by the sold quantity and its basis.
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
