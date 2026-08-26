import { cn } from "@/lib/utils";
import { formatPercent, formatQuantity, formatUsd } from "@/lib/format/money";

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
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[11.5px] font-medium text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-[19px] font-semibold tabular-nums",
          tone === "gain" && "text-state-gain",
          tone === "loss" && "text-destructive",
          !tone && "text-foreground"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-0.5 font-mono text-[12px] tabular-nums",
          tone === "gain" && "text-state-gain",
          tone === "loss" && "text-destructive",
          !tone && "text-muted-foreground"
        )}
      >
        {subLine}
      </p>
    </div>
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
  const isGain = Number(gainLossUsd) >= 0;

  return (
    <div className="grid grid-cols-4 gap-4">
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
        tone={isGain ? "gain" : "loss"}
      />
    </div>
  );
}
