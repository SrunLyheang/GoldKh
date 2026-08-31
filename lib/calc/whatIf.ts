import Decimal from "decimal.js";
import { computeGainLoss } from "./gainLoss";
import type { Holdings } from "./holdings";
import {
  fromTroyOz,
  priceFromTroyOz,
  toTroyOz,
  type GoldUnit,
} from "./units";

export type WhatIfMode = "buy" | "sell";

export interface WhatIfInput {
  mode: WhatIfMode;
  quantity: string;
  unit: GoldUnit;
  // The whole hypothetical amount, matching the Add dialog's "Total
  // amount paid" field — money out for a buy, money in for a sell. Not a
  // per-unit price.
  totalPriceUsd: string;
  // Live spot price per troy oz, used to value the resulting position for
  // the unrealized P&L rows.
  currentPricePerTroyOz: string;
}

// A single figure shown as current → projected, with the signed change
// between them so the UI can render a delta with gain/loss tone.
export interface WhatIfMetric {
  before: string;
  after: string;
  delta: string;
}

export interface WhatIfResult {
  mode: WhatIfMode;
  // Sell mode only: the hypothetical quantity exceeds the current
  // position. The numeric fields are still filled in, but the UI shows a
  // guard message instead (dashboard-expansion-plan.md §5.4).
  overSell: boolean;

  averageCostPerDamlung: WhatIfMetric;
  // The spot per damlung at which the resulting position breaks even.
  // With no fees modelled this equals the resulting average cost; a sell
  // leaves it unchanged.
  breakEvenSpotPerDamlung: WhatIfMetric;

  holdingsChi: WhatIfMetric;
  holdingsDamlung: WhatIfMetric;

  // Unrealized gain/loss on the resulting position at today's spot.
  unrealizedUsd: WhatIfMetric;
  unrealizedPercent: WhatIfMetric;

  // Sell mode only ("0" for a buy): cash received and the gain/loss
  // realized on the sold gold, valued at the current average cost — the
  // same weighted-average basis as lib/calc/realized.ts.
  proceedsUsd: string;
  realizedUsd: string;
  realizedPercent: string;
}

const ZERO_METRIC: WhatIfMetric = { before: "0", after: "0", delta: "0" };

const ZERO_RESULT: WhatIfResult = {
  mode: "buy",
  overSell: false,
  averageCostPerDamlung: ZERO_METRIC,
  breakEvenSpotPerDamlung: ZERO_METRIC,
  holdingsChi: ZERO_METRIC,
  holdingsDamlung: ZERO_METRIC,
  unrealizedUsd: ZERO_METRIC,
  unrealizedPercent: ZERO_METRIC,
  proceedsUsd: "0",
  realizedUsd: "0",
  realizedPercent: "0",
};

function metric(before: Decimal, after: Decimal): WhatIfMetric {
  return {
    before: before.toString(),
    after: after.toString(),
    delta: after.minus(before).toString(),
  };
}

// Value a quantity of gold at the current spot price, in USD — the
// spot-implied total the calculator offers as a starting point for the
// "total price" field. A non-positive quantity yields "0".
export function spotImpliedTotal(
  quantity: string,
  unit: GoldUnit,
  currentPricePerTroyOz: string,
): string {
  const qty = new Decimal(quantity || "0");
  if (qty.lessThanOrEqualTo(0)) return "0";
  const qtyOz = new Decimal(toTroyOz(quantity, unit));
  return qtyOz.times(currentPricePerTroyOz).toString();
}

// Fold a hypothetical buy or sell into the current weighted-average
// position and report the projected average cost, holdings, break-even,
// and unrealized P&L at today's spot — each as a current → projected
// pair (dashboard-expansion-plan.md §5.4). Stateless, pure, no
// persistence. A non-positive hypothetical quantity yields a zeroed
// result so the calculator can render its empty state.
export function computeWhatIf(
  current: Pick<Holdings, "totalTroyOz" | "averageCostPerTroyOz">,
  input: WhatIfInput,
): WhatIfResult {
  const tradedOz = new Decimal(toTroyOz(input.quantity, input.unit));
  if (tradedOz.lessThanOrEqualTo(0)) {
    return { ...ZERO_RESULT, mode: input.mode };
  }

  const currentOz = new Decimal(current.totalTroyOz);
  const currentAvgPerOz = new Decimal(current.averageCostPerTroyOz);
  const spot = input.currentPricePerTroyOz;

  const currentAvgPerDamlung = new Decimal(
    priceFromTroyOz(currentAvgPerOz.toString(), "damlung"),
  );
  const currentPnl = computeGainLoss(
    currentOz.toString(),
    currentAvgPerOz.toString(),
    spot,
  );

  let newOz: Decimal;
  let newAvgPerOz: Decimal;
  let overSell = false;
  let proceedsUsd = "0";
  let realizedUsd = "0";
  let realizedPercent = "0";

  if (input.mode === "buy") {
    const currentCost = currentOz.times(currentAvgPerOz);
    newOz = currentOz.plus(tradedOz);
    newAvgPerOz = newOz.isZero()
      ? new Decimal(0)
      : currentCost.plus(input.totalPriceUsd).div(newOz);
  } else {
    overSell = tradedOz.greaterThan(currentOz);
    // A sell leaves the weighted-average cost per unit untouched; it only
    // draws the position down (see computeHoldings).
    newOz = currentOz.minus(tradedOz);
    newAvgPerOz = currentAvgPerOz;

    const costBasisSold = tradedOz.times(currentAvgPerOz);
    const proceeds = new Decimal(input.totalPriceUsd);
    const realized = proceeds.minus(costBasisSold);
    proceedsUsd = proceeds.toString();
    realizedUsd = realized.toString();
    realizedPercent = costBasisSold.isZero()
      ? "0"
      : realized.div(costBasisSold).times(100).toString();
  }

  const newAvgPerDamlung = new Decimal(
    priceFromTroyOz(newAvgPerOz.toString(), "damlung"),
  );
  const newPnl = computeGainLoss(
    newOz.toString(),
    newAvgPerOz.toString(),
    spot,
  );

  return {
    mode: input.mode,
    overSell,
    averageCostPerDamlung: metric(currentAvgPerDamlung, newAvgPerDamlung),
    breakEvenSpotPerDamlung: metric(currentAvgPerDamlung, newAvgPerDamlung),
    holdingsChi: metric(
      new Decimal(fromTroyOz(currentOz.toString(), "chi")),
      new Decimal(fromTroyOz(newOz.toString(), "chi")),
    ),
    holdingsDamlung: metric(
      new Decimal(fromTroyOz(currentOz.toString(), "damlung")),
      new Decimal(fromTroyOz(newOz.toString(), "damlung")),
    ),
    unrealizedUsd: metric(
      new Decimal(currentPnl.gainLossUsd),
      new Decimal(newPnl.gainLossUsd),
    ),
    unrealizedPercent: metric(
      new Decimal(currentPnl.gainLossPercent),
      new Decimal(newPnl.gainLossPercent),
    ),
    proceedsUsd,
    realizedUsd,
    realizedPercent,
  };
}
