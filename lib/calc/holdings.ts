import Decimal from "decimal.js";
import { priceToTroyOz, toTroyOz, type GoldUnit } from "./units";

export interface TransactionLike {
  type: "buy" | "sell";
  quantity: string;
  unit: GoldUnit;
  pricePerUnit: string;
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
export function computeHoldings(transactions: TransactionLike[]): Holdings {
  let totalQtyOz = new Decimal(0);
  let totalCostUsd = new Decimal(0);

  for (const tx of transactions) {
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
