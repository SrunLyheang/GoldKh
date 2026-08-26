import { formatUsd } from "@/lib/format/money";

interface HeroPriceCardProps {
  pricePerTroyOz: string;
  pricePerChi: string;
  pricePerDamlung: string;
  capturedAt: Date;
  isStale: boolean;
}

export function HeroPriceCard({
  pricePerTroyOz,
  pricePerChi,
  pricePerDamlung,
  capturedAt,
  isStale,
}: HeroPriceCardProps) {
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(capturedAt);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-6">
      <div className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-primary/40 via-primary to-primary/40" />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="text-[11.5px] font-medium text-muted-foreground">
            Price per Damlung
          </p>
          <p className="font-mono text-[46px] font-semibold leading-tight tabular-nums text-foreground">
            {formatUsd(pricePerDamlung)}
          </p>
          <p className="mt-1 font-mono text-[12.5px] tabular-nums text-muted-foreground">
            {formatUsd(pricePerTroyOz)}/oz · {formatUsd(pricePerChi)}/chi
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={
                isStale
                  ? "h-1.5 w-1.5 rounded-full bg-muted-foreground"
                  : "h-1.5 w-1.5 rounded-full bg-state-gain"
              }
            />
            <span className="font-mono text-[12.5px] tabular-nums text-muted-foreground">
              {isStale ? "Stale" : "Live"} as of {timeLabel}
            </span>
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11.5px] text-muted-foreground">
        Cambodian gold shops typically sell above spot — a position may show as
        a &quot;loss&quot; here that is really dealer premium, not an actual
        loss.
      </p>
    </div>
  );
}
