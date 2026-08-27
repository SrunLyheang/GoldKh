"use client";

import { useLocale } from "@/lib/i18n/locale-context";

// A static, honest replica of the real dashboard hero card
// (components/dashboard/hero-price-card.tsx) so the landing hero shows
// the actual product surface rather than a stock illustration. Every
// figure is a fixed, internally-consistent sample — 5 damlung bought at
// a $3,900 average, marked against a $4,180 spot — and the card is
// tagged so it can't be mistaken for live data.
const SAMPLE = {
  perDamlung: "$4,180.00",
  perOz: "$3,467.00",
  perChi: "$418.00",
  asOf: "9:41 AM",
  holdings: "5.00",
  avgCost: "$3,900.00",
  marketValue: "$20,900.00",
  gain: "+$1,400.00",
  gainPct: "+7.2%",
};

function Mono({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`font-mono tabular-nums ${className}`}>{children}</span>
  );
}

export function SampleReadout() {
  const { t } = useLocale();

  return (
    <div className="relative w-full max-w-md overflow-hidden border border-border bg-card p-5 shadow-vault-lg sm:p-7">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-primary" />
      <span className="tt-label absolute right-0 top-1 border-b border-l border-border bg-muted px-2 py-1 text-[9.5px] text-muted-foreground">
        {t.welcome.hero.sampleTag}
      </span>

      <p className="tt-label text-[10.5px] text-muted-foreground">
        {t.hero.pricePer(t.unit.damlung)}
      </p>
      <Mono className="mt-1.5 block text-[34px] font-semibold leading-tight tracking-tight">
        {SAMPLE.perDamlung}
      </Mono>
      <Mono className="mt-1.5 block text-[12px] text-muted-foreground">
        {`${SAMPLE.perOz}/oz · ${SAMPLE.perChi}/${t.unit.chi.toLowerCase()}`}
      </Mono>

      <div className="mt-3 flex items-center gap-1.5">
        <span aria-hidden className="h-1.5 w-1.5 bg-state-gain" />
        <Mono className="tt-label text-[10.5px] text-muted-foreground">
          {`[${t.hero.live}] ${t.hero.asOf(SAMPLE.asOf)}`}
        </Mono>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-px border border-border bg-border">
        <Cell label={t.stat.totalHoldings} value={`${SAMPLE.holdings} ${t.unit.damlung}`} />
        <Cell
          label={t.stat.averageCost}
          value={SAMPLE.avgCost}
          sub={t.stat.per(t.unit.damlung)}
        />
        <Cell
          label={t.stat.marketValue}
          value={SAMPLE.marketValue}
          sub={t.stat.atCurrentSpot}
        />
        <Cell
          label={t.stat.gainLoss}
          value={SAMPLE.gain}
          sub={SAMPLE.gainPct}
          tone="gain"
        />
      </dl>
    </div>
  );
}

function Cell({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "gain";
}) {
  const toneClass = tone === "gain" ? "text-state-gain" : "text-foreground";
  return (
    <div className="bg-card p-3">
      <dt className="tt-label text-[9.5px] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-mono tabular-nums text-[15px] font-semibold ${toneClass}`}>
        {value}
      </dd>
      {sub && (
        <dd
          className={`mt-0.5 font-mono tabular-nums text-[10.5px] ${
            tone === "gain" ? "text-state-gain" : "text-muted-foreground"
          }`}
        >
          {sub}
        </dd>
      )}
    </div>
  );
}
