import type { CSSProperties } from "react";
import type { GoldUnit } from "@/lib/calc/units";
import { formatClockTime } from "@/lib/format/datetime";
import { formatUsd } from "@/lib/format/money";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { useValuePulse } from "@/lib/ui/use-value-pulse";
import { cn } from "@/lib/utils";
import { MonoValue } from "./mono-value";
import { RefreshButton } from "./refresh-button";
import { SegmentedControl } from "./segmented-control";

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

// "Gold today" — the first thing written on today's page. It sits on the
// page (no card of its own): a dated status line, the price as the
// page's headline, and the same price in the other units underneath.
// Freshness is a quiet line, never an alarm: a stale price is a normal
// state between shop visits (DESIGN.md § Degraded & stale states).
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
  const marketClosed = marketOpen === false;
  const timeLabel = formatClockTime(capturedAt);

  const isChi = displayUnit === "chi";
  const headlinePrice = isChi ? pricePerChi : pricePerDamlung;
  const secondaryPrice = isChi ? pricePerDamlung : pricePerChi;
  const {
    primary: primaryUnitLabel,
    primaryLower,
    secondaryLower: secondaryUnitLabel,
  } = unitLabels(displayUnit);

  // Keyed on the unit-independent spot so a unit toggle doesn't pulse.
  const pulsing = useValuePulse(pricePerTroyOz);

  return (
    <section aria-labelledby="gold-today">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="flex items-center gap-2 text-label text-muted-foreground">
          <span
            aria-hidden="true"
            className={cn(
              "inline-block h-2 w-2 rounded-full",
              isStale ? "bg-faint" : "bg-state-gain",
            )}
          />
          <span className="font-medium text-foreground/90">
            {isStale ? t.hero.stale : t.hero.live}
          </span>
          <span>{t.hero.asOf(timeLabel)}</span>
        </p>
        <RefreshButton
          cooldownEndsAt={refreshCooldownEndsAt}
          marketClosed={marketClosed}
        />
      </div>
      {marketClosed && (
        <p className="text-label text-muted-foreground">{t.hero.marketClosed}</p>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <h2 id="gold-today" className="tt-heading text-figure text-foreground">
          {t.hero.goldToday}
        </h2>
        {onDisplayUnitChange && (
          <SegmentedControl
            ariaLabel="Display unit"
            value={displayUnit}
            onChange={onDisplayUnitChange}
            options={[
              { value: "chi", label: t.unit.chi },
              { value: "damlung", label: t.unit.damlung },
            ]}
          />
        )}
      </div>
      <p className="sr-only">{t.hero.pricePer(primaryUnitLabel)}</p>

      {/* The price is the page's title — the only h1 on the route. */}
      <h1
        className={cn("mt-1 flex flex-wrap items-baseline gap-x-3", pulsing && "value-pulse-active")}
        style={{ "--pulse-tone": "var(--gold-leaf)" } as CSSProperties}
      >
        <span className="tt-display text-display font-semibold leading-[1.05] text-foreground sm:text-display-lg">
          {formatUsd(headlinePrice)}
        </span>
        <span className="font-serif text-emphasis text-muted-foreground">
          {t.hero.per(primaryLower)}
        </span>
      </h1>
      <MonoValue tone="muted" className="mt-2 block text-detail">
        {formatUsd(secondaryPrice)}/{secondaryUnitLabel} · {formatUsd(pricePerTroyOz)}/oz
      </MonoValue>
      <p className="mt-3 max-w-[52ch] text-label leading-relaxed text-faint">
        {t.hero.disclaimer}
      </p>
    </section>
  );
}
