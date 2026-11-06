"use client";

import Decimal from "decimal.js";
import type { CSSProperties } from "react";
import type { GoldUnit } from "@/lib/calc/units";
import { formatDamlungChi, formatQuantity, formatUsd } from "@/lib/format/money";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { useValuePulse } from "@/lib/ui/use-value-pulse";
import { cn } from "@/lib/utils";
import { AnimatedPnlCard } from "./animated-pnl-card";
import { MonoValue } from "./mono-value";

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

// One written line of the position: a label on the left, the figure on
// the right, sitting on the page's ruling (each line is one --line tall).
function LedgerLine({
  label,
  value,
  pulseKey,
  sub,
}: {
  label: string;
  value: string;
  pulseKey: number;
  sub?: string;
}) {
  const pulsing = useValuePulse(pulseKey);
  return (
    <div className="flex min-h-(--line) items-baseline justify-between gap-4 py-1">
      <dt className="text-body text-muted-foreground">{label}</dt>
      <dd className="shrink-0 whitespace-nowrap text-right">
        <span
          className={cn("inline-block px-1", pulsing && "value-pulse-active")}
          style={{ "--pulse-tone": "var(--gold-leaf)" } as CSSProperties}
        >
          <MonoValue className="text-emphasis font-medium">{value}</MonoValue>
        </span>
        {sub && (
          <MonoValue tone="muted" className="ml-1 text-detail">
            {sub}
          </MonoValue>
        )}
      </dd>
    </div>
  );
}

// "What you hold" — the position written as a short ledger: how much is
// in the notebook, what it cost, what it's worth, and then the sum, ruled
// off the way a bookkeeper would (single line over, double line under).
// Figures land on their value; they don't roll on every visit.
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
  const { primaryLower: primaryUnit } = unitLabels(displayUnit);
  const total = isChi ? totalChi : totalDamlung;
  // Cost of what's held = worth today − unrealized gain. Exact decimal;
  // display only.
  const costBasis = new Decimal(marketValueUsd || 0)
    .minus(gainLossUsd || 0)
    .toString();

  return (
    <section aria-labelledby="what-you-hold">
      <h2 id="what-you-hold" className="tt-heading text-figure text-foreground">
        {t.stat.sectionLabel}
      </h2>
      <p className="mt-1 font-serif text-figure-lg font-semibold leading-tight text-foreground">
        {formatDamlungChi(totalChi)}
      </p>
      <dl className="mt-3">
        <LedgerLine
          label={t.stat.totalHoldings}
          value={`${formatQuantity(total)} ${primaryUnit}`}
          pulseKey={Number(totalDamlung)}
        />
        <LedgerLine
          label={t.stat.averageCost}
          value={formatUsd(isChi ? averageCostPerChi : averageCostPerDamlung)}
          sub={`/${primaryUnit}`}
          pulseKey={Number(averageCostPerDamlung)}
        />
        <LedgerLine
          label={t.stat.costBasis}
          value={formatUsd(costBasis)}
          pulseKey={Number(costBasis)}
        />
        <LedgerLine
          label={t.stat.marketValue}
          value={formatUsd(marketValueUsd)}
          pulseKey={Number(marketValueUsd)}
        />
      </dl>
      <AnimatedPnlCard
        label={t.stat.gainLoss}
        gainLossUsd={gainLossUsd}
        gainLossPercent={gainLossPercent}
      />
    </section>
  );
}
