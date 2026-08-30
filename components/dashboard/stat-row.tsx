"use client";

import type { GoldUnit } from "@/lib/calc/units";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { useLocale } from "@/lib/i18n/locale-context";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { COUNT_UP_MS, useCountUp } from "@/lib/ui/use-count-up";
import { AnimatedPnlCard } from "./animated-pnl-card";
import { MonoValue } from "./mono-value";
import { Panel } from "./panel";

interface StatRowProps {
  totalChi: string;
  totalDamlung: string;
  averageCostPerChi: string;
  averageCostPerDamlung: string;
  marketValueUsd: string;
  gainLossUsd: string;
  gainLossPercent: string;
  displayUnit?: GoldUnit;
}

// Total Holdings / Average Cost / Market Value all roll up from zero on
// every page entry. A unit toggle afterwards snaps (see useCountUp's
// `from` mode). The Unrealized Gain/Loss card rolls from its last-seen
// value instead — that one is AnimatedPnlCard.
function StatCard({
  label,
  amount,
  format,
  subLine,
}: {
  label: string;
  amount: number;
  format: (value: number) => string;
  subLine: string;
}) {
  const value = useCountUp(amount, { from: 0, durationMs: COUNT_UP_MS, format });
  return (
    <Panel>
      <p className="tt-label text-[11px] text-muted-foreground">{label}</p>
      <MonoValue
        tone="foreground"
        className="mt-1.5 block text-[19px] font-semibold"
      >
        {value}
      </MonoValue>
      <MonoValue tone="muted" className="mt-1 block text-[12px]">
        {subLine}
      </MonoValue>
    </Panel>
  );
}

export function StatRow({
  totalChi,
  totalDamlung,
  averageCostPerChi,
  averageCostPerDamlung,
  marketValueUsd,
  gainLossUsd,
  gainLossPercent,
  displayUnit = "damlung",
}: StatRowProps) {
  const { t } = useLocale();
  const isChi = displayUnit === "chi";
  // Lowercase to match this row's pre-i18n convention ("1 damlung", "per
  // chi") — unlike the hero card's dropdown-style "Chi"/"Damlung" labels.
  const { primaryLower: primaryUnit, secondaryLower: secondaryUnit } =
    unitLabels(t, displayUnit);
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
      <StatCard
        label={t.stat.totalHoldings}
        amount={Number(isChi ? totalChi : totalDamlung)}
        format={(n) => `${formatQuantity(String(n))} ${primaryUnit}`}
        subLine={`${formatQuantity(isChi ? totalDamlung : totalChi)} ${secondaryUnit}`}
      />
      <StatCard
        label={t.stat.averageCost}
        amount={Number(isChi ? averageCostPerChi : averageCostPerDamlung)}
        format={(n) => formatUsd(String(n))}
        subLine={t.stat.per(primaryUnit)}
      />
      <StatCard
        label={t.stat.marketValue}
        amount={Number(marketValueUsd)}
        format={(n) => formatUsd(String(n))}
        subLine={t.stat.atCurrentSpot}
      />
      <AnimatedPnlCard
        label={t.stat.gainLoss}
        gainLossUsd={gainLossUsd}
        gainLossPercent={gainLossPercent}
      />
    </div>
  );
}
