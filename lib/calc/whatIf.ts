import Decimal from "decimal.js";
import type { Holdings } from "./holdings";
import { fromTroyOz, priceFromTroyOz, toTroyOz, type GoldUnit } from "./units";

export interface WhatIfInput {
  quantity: string;
  unit: GoldUnit;
  // The whole hypothetical purchase amount, matching the Add dialog's
  // "Total amount paid" field — not a per-unit price.
  totalPriceUsd: string;
}

export interface WhatIfResult {
  newAverageCostPerTroyOz: string;
  newAverageCostPerDamlung: string;
  newHoldingsChi: string;
  newHoldingsDamlung: string;
  // The spot price per damlung at which the blended position breaks even.
  // With no fees modelled this equals the blended average cost.
  breakEvenSpotPerDamlung: string;
}

const ZERO_RESULT: WhatIfResult = {
  newAverageCostPerTroyOz: "0",
  newAverageCostPerDamlung: "0",
  newHoldingsChi: "0",
  newHoldingsDamlung: "0",
  breakEvenSpotPerDamlung: "0",
};

// Fold a hypothetical buy into the current weighted-average position and
// report the blended average cost, the new totals, and the break-even
// spot (dashboard-expansion-plan.md §5.4). Stateless, pure, no
// persistence. A non-positive hypothetical quantity yields all zeros so
// the calculator can render its empty state.
export function computeWhatIf(
  current: Pick<Holdings, "totalTroyOz" | "averageCostPerTroyOz">,
  input: WhatIfInput,
): WhatIfResult {
  const addedOz = new Decimal(toTroyOz(input.quantity, input.unit));
  if (addedOz.lessThanOrEqualTo(0)) {
    return ZERO_RESULT;
  }

  const currentOz = new Decimal(current.totalTroyOz);
  const currentCost = currentOz.times(current.averageCostPerTroyOz);

  const newOz = currentOz.plus(addedOz);
  const newCost = currentCost.plus(input.totalPriceUsd);
  const newAvgPerTroyOz = newCost.div(newOz);

  const newAvgPerDamlung = priceFromTroyOz(newAvgPerTroyOz.toString(), "damlung");

  return {
    newAverageCostPerTroyOz: newAvgPerTroyOz.toString(),
    newAverageCostPerDamlung: newAvgPerDamlung,
    newHoldingsChi: fromTroyOz(newOz.toString(), "chi"),
    newHoldingsDamlung: fromTroyOz(newOz.toString(), "damlung"),
    breakEvenSpotPerDamlung: newAvgPerDamlung,
  };
}
