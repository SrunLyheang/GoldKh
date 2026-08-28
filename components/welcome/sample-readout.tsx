"use client";

import { useLocale } from "@/lib/i18n/locale-context";

// The landing page's signature: the real dashboard readout shown once
// as a single full-width ruled line — mono tabular figures on top, the
// column label hanging beneath each hairline, like a weight stamped in
// a goldsmith's ledger. Every figure is a fixed, internally-consistent
// sample (5 damlung bought at a $3,900 average, marked against a $4,180
// spot) and the strip is tagged so it can't be read as live data.
const SAMPLE = {
  perDamlung: "$4,180.00",
  asOf: "9:41 AM",
  holdings: "5.00",
  avgCost: "$3,900.00",
  marketValue: "$20,900.00",
  gain: "+$1,400.00",
  gainPct: "+7.2%",
};

export function AssayStrip() {
  const { t } = useLocale();

  const cells = [
    { label: t.hero.pricePer(t.unit.damlung), value: SAMPLE.perDamlung },
    {
      label: t.stat.totalHoldings,
      value: `${SAMPLE.holdings} ${t.unit.damlung}`,
    },
    {
      label: t.stat.averageCost,
      value: SAMPLE.avgCost,
      sub: t.stat.per(t.unit.damlung),
    },
    {
      label: t.stat.marketValue,
      value: SAMPLE.marketValue,
      sub: t.stat.atCurrentSpot,
    },
    {
      label: t.stat.gainLoss,
      value: SAMPLE.gain,
      sub: SAMPLE.gainPct,
      gain: true,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div
        className="overflow-hidden rounded-xl border border-border bg-card"
        style={{ boxShadow: "0 1px 2px rgb(0 0 0 / 0.04), 0 18px 40px -28px rgb(0 0 0 / 0.22)" }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            <span>{t.welcome.hero.sampleTag}</span>
            <span aria-hidden> &middot; {t.hero.asOf(SAMPLE.asOf)}</span>
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-[var(--state-gain)]">
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-[var(--state-gain)]"
            />
            {t.hero.live}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-5">
          {cells.map((cell, i) => (
            <div
              key={cell.label}
              className={`bg-card px-5 py-4 ${
                i === cells.length - 1 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <dd
                className={`font-mono tabular-nums text-[17px] font-semibold tracking-[-0.01em] ${
                  cell.gain ? "text-[var(--state-gain)]" : "text-foreground"
                }`}
              >
                {cell.value}
              </dd>
              {cell.sub && (
                <dd
                  className={`mt-0.5 font-mono tabular-nums text-[11px] ${
                    cell.gain
                      ? "text-[var(--state-gain)]"
                      : "text-muted-foreground"
                  }`}
                >
                  {cell.sub}
                </dd>
              )}
              <dt className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                {cell.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>

      <p className="mx-auto mt-3 max-w-[64ch] text-center text-[11.5px] leading-relaxed text-muted-foreground">
        {t.hero.disclaimer}
      </p>
    </div>
  );
}
