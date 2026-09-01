// Marketing-only weighted-average math for the landing page's "Try it"
// simulator and unit playground. Deliberately NOT `lib/calc/` (the real
// ledger's Decimal.js money math): nothing here touches a DB, real price, or
// real position, and the numbers are labelled indicative, so plain floats
// are fine and keep the widgets snappy.

export const GRAMS_PER_TROY_OZ = 31.1034768;
export const GRAMS_PER_DAMLUNG = 37.5;
export const CHI_PER_DAMLUNG = 10;
export const TROY_OZ_PER_DAMLUNG = GRAMS_PER_DAMLUNG / GRAMS_PER_TROY_OZ; // ≈ 1.205658

// Indicative landing-page spot. Not a live feed (the dashboard uses
// goldapi.io). Bump when it drifts noticeably from the market.
export const INDICATIVE_SPOT_PER_OZ = 4100;

export const INDICATIVE_SPOT_PER_DAMLUNG =
  INDICATIVE_SPOT_PER_OZ * TROY_OZ_PER_DAMLUNG;

export type GoldUnit = "damlung" | "chi";

export interface MarketingBuy {
  id: string;
  quantity: number;
  unit: GoldUnit;
  // USD paid per damlung. The form collects total + quantity; the caller
  // divides once so everything downstream is one unit.
  pricePerDamlung: number;
}

export interface MarketingPosition {
  totalDamlung: number;
  totalChi: number;
  totalGrams: number;
  totalOz: number;
  // Weighted average of every buy, USD per damlung. Zero when empty.
  averageCostPerDamlung: number;
  totalInvestedUsd: number;
  marketValueUsd: number;
  unrealizedUsd: number;
  // Signed % return on cost. Zero when nothing is invested.
  unrealizedPercent: number;
}

export function toDamlung(quantity: number, unit: GoldUnit): number {
  const q = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  return unit === "damlung" ? q : q / CHI_PER_DAMLUNG;
}

// Fold buys into one weighted-average position, valued at the supplied spot
// (USD per damlung). Sells aren't modelled — the simulator only needs buys.
export function computeMarketingPosition(
  buys: MarketingBuy[],
  spotPerDamlung: number,
): MarketingPosition {
  let totalDamlung = 0;
  let totalInvestedUsd = 0;

  for (const buy of buys) {
    const damlung = toDamlung(buy.quantity, buy.unit);
    if (damlung <= 0) continue;
    totalDamlung += damlung;
    totalInvestedUsd += damlung * Math.max(0, buy.pricePerDamlung);
  }

  const averageCostPerDamlung =
    totalDamlung > 0 ? totalInvestedUsd / totalDamlung : 0;
  const marketValueUsd = totalDamlung * Math.max(0, spotPerDamlung);
  const unrealizedUsd = marketValueUsd - totalInvestedUsd;
  const unrealizedPercent =
    totalInvestedUsd > 0 ? (unrealizedUsd / totalInvestedUsd) * 100 : 0;

  return {
    totalDamlung,
    totalChi: totalDamlung * CHI_PER_DAMLUNG,
    totalGrams: totalDamlung * GRAMS_PER_DAMLUNG,
    totalOz: totalDamlung * TROY_OZ_PER_DAMLUNG,
    averageCostPerDamlung,
    totalInvestedUsd,
    marketValueUsd,
    unrealizedUsd,
    unrealizedPercent,
  };
}

export function formatUsd(value: number, fractionDigits = 2): string {
  if (!Number.isFinite(value)) return "$0.00";
  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}`;
}

export function formatSignedUsd(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${formatUsd(Math.abs(value))}`;
}

export function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "−";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}
