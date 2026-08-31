"use client";

import { useCountUp } from "@/lib/ui/use-count-up";
import {
  computeMarketingPosition,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
  INDICATIVE_SPOT_PER_DAMLUNG,
  type MarketingBuy,
} from "./marketing-calc";
import { useInView } from "./use-reveal";

// A fixed illustrative ledger — the same weighted-average math the rest
// of the page uses, so the numbers here agree with the simulator below.
const DEMO_BUYS: MarketingBuy[] = [
  { id: "d1", quantity: 1, unit: "damlung", pricePerDamlung: 4600 },
  { id: "d2", quantity: 1, unit: "damlung", pricePerDamlung: 4850 },
  { id: "d3", quantity: 5, unit: "chi", pricePerDamlung: 4700 },
];
const DEMO = computeMarketingPosition(DEMO_BUYS, INDICATIVE_SPOT_PER_DAMLUNG);

// The bridge between the hero and the rest of the page: when this section
// scrolls into view it plays a one-shot reveal — a glowing orb ("your
// gold") docks into the corner of a dashboard card that fades up, its
// figures counting from zero. A one-shot on `useInView` rather than a
// scroll-scrubbed pin: no sticky positioning, nothing fighting the
// scroll. Under reduced motion `useInView` resolves immediately and
// `useCountUp` snaps, so it just renders finished.
export function HeroToDashboard() {
  const { ref, visible } = useInView<HTMLDivElement>();

  const count = visible ? 1 : 0;
  const avgCost = useCountUp(DEMO.averageCostPerDamlung * count, {
    durationMs: 1400,
    format: (v) => formatUsd(v),
  });
  const held = useCountUp(DEMO.totalDamlung * count, {
    durationMs: 1400,
    format: (v) => v.toFixed(2),
  });
  const worth = useCountUp(DEMO.marketValueUsd * count, {
    durationMs: 1400,
    format: (v) => formatUsd(v),
  });
  const pnl = useCountUp(DEMO.unrealizedUsd * count, {
    durationMs: 1400,
    format: (v) => formatSignedUsd(v),
  });

  const tiles = [
    { label: "Average cost", value: avgCost, sub: "/ damlung" },
    { label: "You hold", value: held, sub: `damlung · ${DEMO.totalChi.toFixed(1)} chi` },
    { label: "Worth now", value: worth, sub: `${DEMO.totalOz.toFixed(2)} oz` },
    {
      label: "Up / down",
      value: pnl,
      sub: formatSignedPercent(DEMO.unrealizedPercent),
      gain: true,
    },
  ];

  return (
    <section
      ref={ref}
      aria-label="How a ledger comes together"
      className="relative z-10 overflow-hidden border-t border-white/10 bg-black px-5 py-28 sm:px-8"
    >
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left: the docking orb + thesis copy */}
        <div className="relative">
          <div
            className="pointer-events-none absolute h-56 w-56 rounded-full transition-all duration-1200 ease-out sm:h-72 sm:w-72"
            style={{
              left: "8%",
              top: "-6%",
              transform: visible
                ? "translate3d(-40px, -60px, 0) scale(0.34)"
                : "translate3d(0, 0, 0) scale(1)",
              opacity: visible ? 0.85 : 1,
              background:
                "radial-gradient(circle at 40% 35%, rgba(255,220,150,0.9) 0%, rgba(232,150,60,0.55) 38%, rgba(60,150,255,0.18) 62%, transparent 78%)",
              filter: "blur(4px)",
              willChange: "transform, opacity",
            }}
          />
          <div className="relative z-10 max-w-md">
            <span className="mb-3 inline-block font-mono text-xs font-semibold uppercase tracking-widest text-amber-400">
              ✦ Every buy, one picture
            </span>
            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Your buys roll up into one position.
            </h2>
            <p className="text-sm leading-relaxed text-white/60 sm:text-base">
              Every buy you record — at whatever price, on whatever day — folds
              into a single view: what you paid on average, what it&apos;s
              worth today, and whether you&apos;re ahead.
            </p>
          </div>
        </div>

        {/* Right: the dashboard card that fades up */}
        <div
          className="liquid-glass rounded-3xl border border-white/10 p-5 transition-all duration-700 ease-out sm:p-7"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(28px)",
          }}
        >
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-white/60">
              Position
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Indicative
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 font-mono">
            {tiles.map((t) => (
              <div
                key={t.label}
                className="rounded-2xl border border-white/10 bg-black/30 p-3.5"
              >
                <span className="block text-[10px] uppercase tracking-wide text-white/45">
                  {t.label}
                </span>
                <span
                  className={`mt-1 block text-lg font-bold tabular-nums ${
                    t.gain ? "text-emerald-400" : "text-white"
                  }`}
                >
                  {t.value}
                </span>
                <span
                  className={`block text-[10px] ${
                    t.gain ? "text-emerald-400/70" : "text-white/40"
                  }`}
                >
                  {t.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
