import Decimal from "decimal.js";

export interface GainLoss {
  marketValueUsd: string;
  gainLossUsd: string;
  gainLossPercent: string;
}

// Gain/loss stays computed against the spot price, not a retail premium
// — see CONTEXT.md invariant 5. The UI carries a disclaimer explaining
// the gap; this function does not.
export function computeGainLoss(
  totalTroyOz: string,
  averageCostPerTroyOz: string,
  currentPricePerTroyOz: string
): GainLoss {
  const qty = new Decimal(totalTroyOz);
  const avgCost = new Decimal(averageCostPerTroyOz);
  const currentPrice = new Decimal(currentPricePerTroyOz);

  const marketValue = qty.times(currentPrice);
  const costBasis = qty.times(avgCost);
  const gainLoss = marketValue.minus(costBasis);

  return {
    marketValueUsd: marketValue.toString(),
    gainLossUsd: gainLoss.toString(),
    gainLossPercent: costBasis.isZero()
      ? "0"
      : gainLoss.div(costBasis).times(100).toString(),
  };
}
