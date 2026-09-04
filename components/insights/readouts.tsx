"use client";

import type { ReactNode } from "react";
import type { GainLoss } from "@/lib/calc/gainLoss";
import type { Holdings } from "@/lib/calc/holdings";
import type { Realized } from "@/lib/calc/realized";
import type { InsightsAggregates } from "@/lib/calc/insights";
import { priceFromTroyOz } from "@/lib/calc/units";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { MonoValue } from "@/components/dashboard/mono-value";
import { Surface } from "@/components/dashboard/surface";

interface ReadoutsProps {
  holdings: Holdings;
  gainLoss: GainLoss;
  realized: Realized;
  aggregates: InsightsAggregates;
  pricePerTroyOz: string;
}

function signedUsd(value: string): string {
  return `${Number(value) > 0 ? "+" : ""}${formatUsd(value)}`;
}

type Tone = "foreground" | "gain" | "loss";

function Stat({
  label,
  value,
  hint,
  tone = "foreground",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
}) {
  return (
    <Surface>
      <p className="tt-label text-[11px] text-muted-foreground">{label}</p>
      <MonoValue tone={tone} className="mt-1.5 block text-[19px] font-semibold">
        {value}
      </MonoValue>
      {hint ? (
        <MonoValue tone="muted" className="mt-1 block text-[12px]">
          {hint}
        </MonoValue>
      ) : null}
    </Surface>
  );
}

// The headline figures at the top of Insights, shown as a 2×2 stat grid
// in the same idiom as the dashboard's
// Position row — a mono uppercase label, the figure emphasised, a muted
// qualifier. Tiles render only when they have something to say.
export function Readouts({
  holdings,
  gainLoss,
  realized,
  aggregates,
  pricePerTroyOz,
}: ReadoutsProps) {
  const hasHoldings = Number(holdings.totalTroyOz) > 0;

  const tiles: ReactNode[] = [];

  if (hasHoldings) {
    const avg = Number(priceFromTroyOz(holdings.averageCostPerTroyOz, "damlung"));
    const spot = Number(priceFromTroyOz(pricePerTroyOz, "damlung"));
    if (spot > 0) {
      const delta = ((spot - avg) / spot) * 100;
      const rounded = Number(delta.toFixed(1));
      tiles.push(
        <Stat
          key="vsSpot"
          label={t.insights.readoutAvgVsSpotLabel}
          value={`${Math.abs(rounded).toFixed(1)}%`}
          tone={rounded > 0 ? "gain" : rounded < 0 ? "loss" : "foreground"}
          hint={
            rounded > 0
              ? t.insights.belowSpot
              : rounded < 0
                ? t.insights.aboveSpot
                : t.insights.atSpot
          }
        />,
      );
    }
  }

  if (aggregates.buyCount > 0) {
    tiles.push(
      <Stat
        key="invested"
        label={t.insights.readoutInvestedLabel}
        value={formatUsd(aggregates.totalInvestedUsd)}
        hint={t.insights.acrossBuys(aggregates.buyCount)}
      />,
    );
  }

  if (hasHoldings || realized.saleCount > 0) {
    const unrealized = Number(gainLoss.gainLossUsd);
    tiles.push(
      <Stat
        key="net"
        label={t.insights.readoutNetLabel}
        value={signedUsd(gainLoss.gainLossUsd)}
        tone={unrealized > 0 ? "gain" : unrealized < 0 ? "loss" : "foreground"}
        hint={t.insights.realizedSuffix(signedUsd(realized.realizedUsd))}
      />,
    );
  }

  if (aggregates.largestBuy) {
    const { primary: unitLabel } = unitLabels(t, aggregates.largestBuy.unit);
    tiles.push(
      <Stat
        key="largest"
        label={t.insights.readoutLargestLabel}
        value={`${formatQuantity(aggregates.largestBuy.quantity)} ${unitLabel}`}
        hint={aggregates.largestBuy.transactionDate}
      />,
    );
  }

  if (tiles.length === 0) {
    return (
      <p className="text-[13.5px] text-muted-foreground">
        {t.insights.notEnoughData}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">{tiles}</div>
  );
}
