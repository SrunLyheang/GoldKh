// Marketing-only weighted-average math for the "Try it" simulator and the
// unit playground on the public landing page.
//
// This is deliberately NOT `lib/calc/`. That folder is the real ledger's
// money math — Decimal.js, USD-per-troy-ounce canonical unit, no floats
// (architecture.md invariants 4 and 5). Nothing here touches a database,
// a real price, or a real position. The numbers on the landing page are
// indicative and clearly labelled as such, so plain-number arithmetic is
// fine and keeps the interactive widgets snappy.

export const GRAMS_PER_TROY_OZ = 31.1034768;
export const GRAMS_PER_DAMLUNG = 37.5;
export const CHI_PER_DAMLUNG = 10;
export const TROY_OZ_PER_DAMLUNG = GRAMS_PER_DAMLUNG / GRAMS_PER_TROY_OZ; // ≈ 1.205658

// Indicative world spot price used across the landing page. Not a live
// feed — the signed-in dashboard pulls the real spot from goldapi.io.
// Bump this when it drifts noticeably from the market.
export const INDICATIVE_SPOT_PER_OZ = 4100;

export const INDICATIVE_SPOT_PER_DAMLUNG =
  INDICATIVE_SPOT_PER_OZ * TROY_OZ_PER_DAMLUNG;

export type GoldUnit = "damlung" | "chi";

export interface MarketingBuy {
  id: string;
  quantity: number;
  unit: GoldUnit;
  // What the buyer paid per damlung, in USD. The form collects a total
  // and a quantity; the caller divides once so everything downstream
  // works in one unit.
  pricePerDamlung: number;
}

export interface MarketingPosition {
  totalDamlung: number;
  totalChi: number;
  totalGrams: number;
  totalOz: number;
  // Weighted average of every buy, in USD per damlung. Zero when there
  // is nothing in the ledger yet.
  averageCostPerDamlung: number;
  totalInvestedUsd: number;
  marketValueUsd: number;
  unrealizedUsd: number;
  // Signed percentage return on cost. Zero when nothing is invested.
  unrealizedPercent: number;
}

export function toDamlung(quantity: number, unit: GoldUnit): number {
  const q = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  return unit === "damlung" ? q : q / CHI_PER_DAMLUNG;
}

// Fold a list of buys into one weighted-average position, valued at the
// supplied spot price (USD per damlung). Sells are intentionally not
// modelled here — the simulator is about "what did my gold cost me and
// what is it worth now", which only needs buys.
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
  return `$${value.toLocaleString(undefined, {
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
