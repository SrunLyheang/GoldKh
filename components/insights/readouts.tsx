"use client";

import type { ReactNode } from "react";
import type { GainLoss } from "@/lib/calc/gainLoss";
import type { Holdings } from "@/lib/calc/holdings";
import type { Realized } from "@/lib/calc/realized";
import type { InsightsAggregates } from "@/lib/calc/insights";
import { priceFromTroyOz } from "@/lib/calc/units";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { formatEntryDate } from "@/lib/format/datetime";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { MonoValue } from "@/components/dashboard/mono-value";

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
    <div className="py-3">
      <p className="text-detail text-muted-foreground">{label}</p>
      <MonoValue tone={tone} className="figure mt-0.5 block text-figure-lg font-semibold leading-tight">
        {value}
      </MonoValue>
      {hint ? (
        <MonoValue tone="muted" className="mt-0.5 block text-detail">
          {hint}
        </MonoValue>
      ) : null}
    </div>
  );
}

// The headline figures of Insights, written down the margin of the page:
// a plain label, the figure in the ledger face, a quiet qualifier. Each
// renders only when it has something to say.
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
    const { primaryLower: unitLabel } = unitLabels(aggregates.largestBuy.unit);
    tiles.push(
      <Stat
        key="largest"
        label={t.insights.readoutLargestLabel}
        value={`${formatQuantity(aggregates.largestBuy.quantity)} ${unitLabel}`}
        hint={formatEntryDate(aggregates.largestBuy.transactionDate)}
      />,
    );
  }

  if (tiles.length === 0) {
    return (
      <p className="text-detail text-muted-foreground">
        {t.insights.notEnoughData}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-1">{tiles}</div>
  );
}
