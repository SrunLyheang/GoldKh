import { formatUsd } from "@/lib/format/money";
import { MonoValue } from "./mono-value";
import { Panel } from "./panel";
import { RefreshButton } from "./refresh-button";

interface HeroPriceCardProps {
  pricePerTroyOz: string;
  pricePerChi: string;
  pricePerDamlung: string;
  capturedAt: Date;
  isStale: boolean;
  refreshCooldownEndsAt: number | null;
}

export function HeroPriceCard({
  pricePerTroyOz,
  pricePerChi,
  pricePerDamlung,
  capturedAt,
  isStale,
  refreshCooldownEndsAt,
}: HeroPriceCardProps) {
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(capturedAt);

  return (
    <Panel size="lg" className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-0.75 bg-linear-to-r from-primary/40 via-primary to-primary/40" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <p className="text-[11.5px] font-medium text-muted-foreground">
            Price per Damlung
          </p>
          <MonoValue className="text-[34px] font-semibold leading-tight sm:text-[46px]">
            {formatUsd(pricePerDamlung)}
          </MonoValue>
          <MonoValue tone="muted" className="mt-1 block text-[12.5px]">
            {formatUsd(pricePerTroyOz)}/oz · {formatUsd(pricePerChi)}/chi
          </MonoValue>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <div className="flex items-center gap-1.5">
            <span
              className={
                isStale
                  ? "h-1.5 w-1.5 rounded-full bg-muted-foreground"
                  : "h-1.5 w-1.5 rounded-full bg-state-gain"
              }
            />
            <MonoValue tone="muted" className="text-[12.5px]">
              {isStale ? "Stale" : "Live"} as of {timeLabel}
            </MonoValue>
          </div>
          <RefreshButton cooldownEndsAt={refreshCooldownEndsAt} />
        </div>
      </div>
      <p className="mt-4 text-[11.5px] text-muted-foreground">
        Cambodian gold shops typically sell above spot — a position may show as
        a &quot;loss&quot; here that is really dealer premium, not an actual
        loss.
      </p>
    </Panel>
  );
}
