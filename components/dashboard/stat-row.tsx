import type { GoldUnit } from "@/lib/calc/units";
import { formatPercent, formatQuantity, formatUsd } from "@/lib/format/money";
import { toneFromAmount } from "@/lib/format/tone";
import { useLocale } from "@/lib/i18n/locale-context";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { cn } from "@/lib/utils";
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

function StatCard({
  label,
  value,
  subLine,
  tone,
}: {
  label: string;
  value: string;
  subLine: string;
  tone?: "gain" | "loss";
}) {
  return (
    <Panel
      className={cn(
        tone === "gain" && "bg-state-gain/6",
        tone === "loss" && "bg-destructive/6"
      )}
    >
      <p className="tt-label text-[11px] text-muted-foreground">
        {label}
      </p>
      <MonoValue
        tone={tone ?? "foreground"}
        className="mt-1.5 block text-[19px] font-semibold"
      >
        {value}
      </MonoValue>
      <MonoValue tone={tone ?? "muted"} className="mt-1 block text-[12px]">
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
        value={`${formatQuantity(isChi ? totalChi : totalDamlung)} ${primaryUnit}`}
        subLine={`${formatQuantity(isChi ? totalDamlung : totalChi)} ${secondaryUnit}`}
      />
      <StatCard
        label={t.stat.averageCost}
        value={formatUsd(isChi ? averageCostPerChi : averageCostPerDamlung)}
        subLine={t.stat.per(primaryUnit)}
      />
      <StatCard
        label={t.stat.marketValue}
        value={formatUsd(marketValueUsd)}
        subLine={t.stat.atCurrentSpot}
      />
      <StatCard
        label={t.stat.gainLoss}
        value={formatUsd(gainLossUsd)}
        subLine={formatPercent(gainLossPercent)}
        tone={toneFromAmount(gainLossUsd)}
      />
    </div>
  );
}
