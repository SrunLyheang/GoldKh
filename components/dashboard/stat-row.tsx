import { formatPercent, formatQuantity, formatUsd } from "@/lib/format/money";
import { toneFromAmount } from "@/lib/format/tone";
import { MonoValue } from "./mono-value";
import { Panel } from "./panel";

interface StatRowProps {
  totalChi: string;
  totalDamlung: string;
  averageCostPerChi: string;
  marketValueUsd: string;
  gainLossUsd: string;
  gainLossPercent: string;
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
    <Panel>
      <p className="text-[11.5px] font-medium text-muted-foreground">
        {label}
      </p>
      <MonoValue
        tone={tone ?? "foreground"}
        className="mt-1 block text-[19px] font-semibold"
      >
        {value}
      </MonoValue>
      <MonoValue tone={tone ?? "muted"} className="mt-0.5 block text-[12px]">
        {subLine}
      </MonoValue>
    </Panel>
  );
}

export function StatRow({
  totalChi,
  totalDamlung,
  averageCostPerChi,
  marketValueUsd,
  gainLossUsd,
  gainLossPercent,
}: StatRowProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <StatCard
        label="Total Holdings"
        value={`${formatQuantity(totalChi)} chi`}
        subLine={`${formatQuantity(totalDamlung)} damlung`}
      />
      <StatCard
        label="Average Cost"
        value={formatUsd(averageCostPerChi)}
        subLine="per chi"
      />
      <StatCard
        label="Market Value"
        value={formatUsd(marketValueUsd)}
        subLine="at current spot"
      />
      <StatCard
        label="Unrealized Gain/Loss"
        value={formatUsd(gainLossUsd)}
        subLine={formatPercent(gainLossPercent)}
        tone={toneFromAmount(gainLossUsd)}
      />
    </div>
  );
}
