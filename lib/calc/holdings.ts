import Decimal from "decimal.js";
import { priceToTroyOz, toTroyOz, type GoldUnit } from "./units";

export interface TransactionLike {
  type: "buy" | "sell";
  quantity: string;
  unit: GoldUnit;
  pricePerUnit: string;
  currency: "USD" | "KHR";
}

// Lets a caller exclude one specific row (e.g. "compute holdings as if
// the row currently being edited didn't exist yet") without a circular
// import between the calc layer and the transaction components.
export interface TransactionWithId extends TransactionLike {
  id: string;
}

export interface Holdings {
  totalTroyOz: string;
  averageCostPerTroyOz: string;
}

// Weighted average cost, not FIFO — matches how the user thinks about the
// position (total spent against current value). A sell reduces quantity
// and leaves the average cost per unit unchanged; proceeds don't touch
// the basis of what remains (project-overview.md's worked example: hold
// 10 chi at $300 average cost, sell 3, still hold 7 chi at $300 average
// cost).
//
// KHR rows are excluded entirely, not converted — this aggregate is
// USD-denominated (see architecture.md invariant 4) and KHR conversion
// is out of scope (project-overview.md). Mirrors computeRowValuation's
// per-row treatment of non-USD rows in transactionRow.ts.
export function computeHoldings(transactions: TransactionLike[]): Holdings {
  let totalQtyOz = new Decimal(0);
  let totalCostUsd = new Decimal(0);

  for (const tx of transactions) {
    if (tx.currency !== "USD") continue;

    const qtyOz = new Decimal(toTroyOz(tx.quantity, tx.unit));
    const priceOz = new Decimal(priceToTroyOz(tx.pricePerUnit, tx.unit));

    if (tx.type === "buy") {
      totalCostUsd = totalCostUsd.plus(qtyOz.times(priceOz));
      totalQtyOz = totalQtyOz.plus(qtyOz);
    } else {
      const avgCost = totalQtyOz.isZero()
        ? new Decimal(0)
        : totalCostUsd.div(totalQtyOz);
      totalCostUsd = totalCostUsd.minus(qtyOz.times(avgCost));
      totalQtyOz = totalQtyOz.minus(qtyOz);
    }
  }

  return {
    totalTroyOz: totalQtyOz.toString(),
    averageCostPerTroyOz: totalQtyOz.isZero()
      ? "0"
      : totalCostUsd.div(totalQtyOz).toString(),
  };
}
