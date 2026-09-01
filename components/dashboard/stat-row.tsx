"use client";

import type { CSSProperties } from "react";
import type { GoldUnit } from "@/lib/calc/units";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { COUNT_UP_MS } from "@/lib/ui/use-count-up";
import { useValuePulse } from "@/lib/ui/use-value-pulse";
import { cn } from "@/lib/utils";
import { AnimatedPnlCard } from "./animated-pnl-card";
import { CountUpValue } from "./count-up-value";
import { MonoValue } from "./mono-value";
import { Surface } from "./surface";

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
  pulseKey,
  format,
  subLine,
}: {
  label: string;
  amount: number;
  // Unit-independent value to key the pulse off — a unit toggle changes
  // `amount` numerically without a real update, so it must not be used
  // here (mirrors HeroPriceCard's pricePerTroyOz).
  pulseKey: number;
  format: (value: number) => string;
  subLine: string;
}) {
  const pulsing = useValuePulse(pulseKey);
  return (
    <Surface>
      <p className="tt-label text-[11px] text-muted-foreground">{label}</p>
      <span
        className={cn("mt-1.5 block", pulsing && "value-pulse-active")}
        style={{ "--pulse-tone": "var(--primary)" } as CSSProperties}
      >
        <CountUpValue
          target={amount}
          from={0}
          durationMs={COUNT_UP_MS}
          format={format}
          tone="foreground"
          className="block text-[19px] font-semibold"
        />
      </span>
      <MonoValue tone="muted" className="mt-1 block text-[12px]">
        {subLine}
      </MonoValue>
    </Surface>
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
  const isChi = displayUnit === "chi";
  // Lowercase to match this row's pre-i18n convention ("1 damlung", "per
  // chi") — unlike the hero card's dropdown-style "Chi"/"Damlung" labels.
  const { primaryLower: primaryUnit, secondaryLower: secondaryUnit } =
    unitLabels(t, displayUnit);
  return (
    <div>
      <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
        {t.stat.sectionLabel}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        <StatCard
          label={t.stat.totalHoldings}
          amount={Number(isChi ? totalChi : totalDamlung)}
          pulseKey={Number(totalDamlung)}
          format={(n) => `${formatQuantity(String(n))} ${primaryUnit}`}
          subLine={`${formatQuantity(isChi ? totalDamlung : totalChi)} ${secondaryUnit}`}
        />
        <StatCard
          label={t.stat.averageCost}
          amount={Number(isChi ? averageCostPerChi : averageCostPerDamlung)}
          pulseKey={Number(averageCostPerDamlung)}
          format={(n) => formatUsd(String(n))}
          subLine={t.stat.per(primaryUnit)}
        />
        <StatCard
          label={t.stat.marketValue}
          amount={Number(marketValueUsd)}
          pulseKey={Number(marketValueUsd)}
          format={(n) => formatUsd(String(n))}
          subLine={t.stat.atCurrentSpot}
        />
        <AnimatedPnlCard
          label={t.stat.gainLoss}
          gainLossUsd={gainLossUsd}
          gainLossPercent={gainLossPercent}
        />
      </div>
    </div>
  );
}
