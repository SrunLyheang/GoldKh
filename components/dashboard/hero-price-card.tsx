import type { GoldUnit } from "@/lib/calc/units";
import { formatClockTime } from "@/lib/format/datetime";
import { formatUsd } from "@/lib/format/money";
import { useLocale } from "@/lib/i18n/locale-context";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { COUNT_UP_MS, useCountUp } from "@/lib/ui/use-count-up";
import { MonoValue } from "./mono-value";
import { Panel } from "./panel";
import { RefreshButton } from "./refresh-button";
import { UnitToggle } from "./unit-toggle";

interface HeroPriceCardProps {
  pricePerTroyOz: string;
  pricePerChi: string;
  pricePerDamlung: string;
  capturedAt: Date;
  isStale: boolean;
  refreshCooldownEndsAt: number | null;
  marketOpen?: boolean;
  displayUnit?: GoldUnit;
  onDisplayUnitChange?: (unit: GoldUnit) => void;
}

export function HeroPriceCard({
  pricePerTroyOz,
  pricePerChi,
  pricePerDamlung,
  capturedAt,
  isStale,
  refreshCooldownEndsAt,
  marketOpen = true,
  displayUnit = "damlung",
  onDisplayUnitChange,
}: HeroPriceCardProps) {
  const { t } = useLocale();
  const marketClosed = marketOpen === false;
  const timeLabel = formatClockTime(capturedAt);

  const isChi = displayUnit === "chi";
  const headlinePrice = isChi ? pricePerChi : pricePerDamlung;
  const secondaryPrice = isChi ? pricePerDamlung : pricePerChi;
  const { primary: primaryUnitLabel, secondaryLower: secondaryUnitLabel } =
    unitLabels(t, displayUnit);

  // Rolls from zero to the live price on every page entry. A unit toggle
  // afterwards snaps (see useCountUp's `from` mode).
  const headlineDisplay = useCountUp(Number(headlinePrice), {
    from: 0,
    durationMs: COUNT_UP_MS,
    format: (value) => formatUsd(String(value)),
  });

  return (
    <Panel size="lg" className="relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="tt-label text-[11px] text-muted-foreground">
              {t.hero.pricePer(primaryUnitLabel)}
            </p>
            {onDisplayUnitChange && (
              <UnitToggle value={displayUnit} onChange={onDisplayUnitChange} />
            )}
          </div>
          <MonoValue className="tt-display mt-1.5 block text-[34px] font-semibold tracking-tight leading-tight sm:text-[46px]">
            {headlineDisplay}
          </MonoValue>
          <MonoValue tone="muted" className="mt-1.5 block text-[12.5px]">
            {formatUsd(pricePerTroyOz)}/oz · {formatUsd(secondaryPrice)}/
            {secondaryUnitLabel}
          </MonoValue>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2.5 sm:items-end">
          <div className="flex items-center gap-1.5">
            <span
              className={
                isStale
                  ? "h-1.5 w-1.5 bg-muted-foreground"
                  : "h-1.5 w-1.5 bg-state-gain"
              }
            />
            <MonoValue tone="muted" className="tt-label text-[11px]">
              <span className="tt-bracket">
                {isStale ? t.hero.stale : t.hero.live}
              </span>{" "}
              {t.hero.asOf(timeLabel)}
            </MonoValue>
          </div>
          {marketClosed && (
            <MonoValue tone="muted" className="tt-label text-[11px]">
              {t.hero.marketClosed}
            </MonoValue>
          )}
          <RefreshButton
            cooldownEndsAt={refreshCooldownEndsAt}
            marketClosed={marketClosed}
          />
        </div>
      </div>
      <p className="mt-5 border-t border-border pt-4 text-[11.5px] text-muted-foreground">
        {t.hero.disclaimer}
      </p>
    </Panel>
  );
}
