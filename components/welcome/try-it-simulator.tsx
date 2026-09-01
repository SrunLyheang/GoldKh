"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus, RotateCcw, Trash2 } from "lucide-react";

import { useCountUp } from "@/lib/ui/use-count-up";
import {
  computeMarketingPosition,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
  INDICATIVE_SPOT_PER_DAMLUNG,
  toDamlung,
  type GoldUnit,
  type MarketingBuy,
} from "./marketing-calc";

const SEED_BUYS: MarketingBuy[] = [
  { id: "seed-1", quantity: 1, unit: "damlung", pricePerDamlung: 4600 },
  { id: "seed-2", quantity: 5, unit: "chi", pricePerDamlung: 4880 },
];

// The spot slider swings from a clear loss to a clear gain against the
// seed cost, so the first drag always shows the number change colour.
const SPOT_MIN = Math.round(INDICATIVE_SPOT_PER_DAMLUNG * 0.6);
const SPOT_MAX = Math.round(INDICATIVE_SPOT_PER_DAMLUNG * 1.5);

function parseAmount(raw: string): number {
  const n = Number.parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

interface TryItSimulatorProps {
  signedIn: boolean;
}

// The interactive heart of the landing page. A visitor builds a pretend
// ledger, then drags "today's price" and watches the weighted-average
// cost, holdings, market value, and gain/loss recompute live. All of it
// is client-side arithmetic on an indicative price (see marketing-calc);
// nothing is saved and nothing hits the real price feed.
export function TryItSimulator({ signedIn }: TryItSimulatorProps) {
  const [buys, setBuys] = useState<MarketingBuy[]>(SEED_BUYS);
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState<GoldUnit>("damlung");
  const [total, setTotal] = useState("");
  const [spot, setSpot] = useState(Math.round(INDICATIVE_SPOT_PER_DAMLUNG));
  const [nextId, setNextId] = useState(1);

  const position = useMemo(
    () => computeMarketingPosition(buys, spot),
    [buys, spot],
  );

  const gainTone = position.unrealizedUsd >= 0 ? "gain" : "loss";
  const spotDeltaPctRaw =
    ((spot - INDICATIVE_SPOT_PER_DAMLUNG) / INDICATIVE_SPOT_PER_DAMLUNG) * 100;
  // Round before choosing a sign so a hair under zero doesn't read "−0.0%".
  const spotDeltaPct = Math.abs(spotDeltaPctRaw) < 0.05 ? 0 : spotDeltaPctRaw;

  // Short, re-aiming rolls: on a slider drag the digits chase the target
  // in ~half a second instead of jumping, which reads as "watching it
  // move". Snaps under reduced motion (useCountUp handles that).
  const avgCostText = useCountUp(position.averageCostPerDamlung, {
    durationMs: 320,
    format: (v) => formatUsd(v),
  });
  const marketValueText = useCountUp(position.marketValueUsd, {
    durationMs: 320,
    format: (v) => formatUsd(v),
  });
  const gainText = useCountUp(position.unrealizedUsd, {
    durationMs: 320,
    format: (v) => formatSignedUsd(v),
  });

  const parsedQty = parseAmount(qty);
  const parsedTotal = parseAmount(total);
  const canAdd = parsedQty > 0 && parsedTotal > 0;

  function addBuy() {
    if (!canAdd) return;
    const damlung = toDamlung(parsedQty, unit);
    setBuys((prev) => [
      ...prev,
      {
        id: `row-${nextId}`,
        quantity: parsedQty,
        unit,
        pricePerDamlung: parsedTotal / damlung,
      },
    ]);
    setNextId((n) => n + 1);
    setTotal("");
  }

  function removeBuy(id: string) {
    setBuys((prev) => prev.filter((b) => b.id !== id));
  }

  function reset() {
    setBuys(SEED_BUYS);
    setSpot(Math.round(INDICATIVE_SPOT_PER_DAMLUNG));
    setQty("1");
    setUnit("damlung");
    setTotal("");
  }

  // P&L bar: a centre line with fill growing right for a gain, left for a
  // loss, capped at ±40% so a wild slider drag stays inside the track.
  const barPct = Math.max(-40, Math.min(40, position.unrealizedPercent));
  // The fill is pinned to the centre line and grows into one half of the
  // track, so ±40% maps onto the 50% half-width (×1.25), not the full bar.
  const barWidth = `${Math.abs(barPct) * 1.25}%`;

  return (
    <div className="liquid-glass rounded-3xl border border-white/10 p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* ── Left: build the ledger ─────────────────────────────────── */}
        <div className="lg:col-span-5">
          <span className="mb-2 inline-block font-mono text-[11px] font-bold uppercase tracking-widest text-amber-300">
            Your pretend ledger
          </span>
          <p className="mb-5 text-sm leading-relaxed text-white/60">
            Add a few buys the way you actually bought them, in chi or
            damlung, with what you paid in total.
          </p>

          <div className="space-y-3">
            <div>
              <label
                htmlFor="sim-qty"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/50"
              >
                How much
              </label>
              <div className="flex gap-2">
                <input
                  id="sim-qty"
                  inputMode="decimal"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black/50 px-4 py-3 font-mono text-lg font-bold text-white outline-none focus:border-amber-400"
                  placeholder="1"
                />
                <div
                  role="group"
                  aria-label="Unit for the new buy"
                  className="flex rounded-2xl border border-white/15 bg-black/50 p-1"
                >
                  {(["damlung", "chi"] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      aria-pressed={unit === u}
                      onClick={() => setUnit(u)}
                      className={`rounded-xl px-3 py-2 font-mono text-xs font-semibold capitalize transition-colors ${
                        unit === u
                          ? "bg-amber-400 text-black"
                          : "text-white/50 hover:text-white"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="sim-total"
                className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-white/50"
              >
                Total paid (USD)
              </label>
              <input
                id="sim-total"
                inputMode="decimal"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addBuy();
                }}
                className="w-full rounded-2xl border border-white/15 bg-black/50 px-4 py-3 font-mono text-lg font-bold text-white outline-none focus:border-amber-400"
                placeholder="4,800"
              />
            </div>

            <button
              type="button"
              onClick={addBuy}
              disabled={!canAdd}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Add to ledger
            </button>
          </div>

          <ul className="mt-5 space-y-2">
            {buys.length === 0 && (
              <li className="rounded-2xl border border-dashed border-white/15 px-4 py-3 text-center font-mono text-xs text-white/40">
                Ledger empty. Add a buy above.
              </li>
            )}
            {buys.map((b) => (
              <li
                key={b.id}
                className="sim-row flex items-center justify-between rounded-2xl border border-white/10 bg-white/3 px-4 py-2.5 font-mono text-xs"
              >
                <span className="text-white/80">
                  {b.quantity} {b.unit === "damlung" ? "damlung" : "chi"}
                </span>
                <span className="text-white/50">
                  {formatUsd(
                    b.pricePerDamlung * toDamlung(b.quantity, b.unit),
                    0,
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => removeBuy(b.id)}
                  aria-label={`Remove ${b.quantity} ${b.unit} buy`}
                  className="text-white/30 transition-colors hover:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={reset}
            className="mt-4 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-white/40 transition-colors hover:text-white/70"
          >
            <RotateCcw className="h-3 w-3" />
            Reset example
          </button>
        </div>

        {/* ── Right: the live position ───────────────────────────────── */}
        <div className="lg:col-span-7">
          <div className="liquid-glass-gold rounded-3xl border border-amber-400/25 p-5 sm:p-7">
            {/* Spot price slider */}
            <div className="mb-6">
              <div className="mb-2 flex items-baseline justify-between">
                <label
                  htmlFor="sim-spot"
                  className="font-mono text-[11px] font-bold uppercase tracking-widest text-amber-300"
                >
                  Drag today&apos;s price
                </label>
                <span className="font-mono text-xs text-white/50">
                  {spotDeltaPct >= 0 ? "+" : "−"}
                  {Math.abs(spotDeltaPct).toFixed(1)}% vs indicative
                </span>
              </div>
              <input
                id="sim-spot"
                type="range"
                min={SPOT_MIN}
                max={SPOT_MAX}
                step={5}
                value={spot}
                onChange={(e) => setSpot(Number(e.target.value))}
                aria-valuetext={`${formatUsd(spot, 0)} per damlung`}
                className="sim-spot-range w-full"
              />
              <div className="mt-1 text-center font-mono text-2xl font-bold text-white">
                {formatUsd(spot, 0)}
                <span className="ml-1 text-xs font-normal text-white/40">
                  /damlung
                </span>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <Stat label="Average cost" value={avgCostText} sub="/ damlung" />
              <Stat
                label="You hold"
                value={`${position.totalDamlung.toFixed(2)}`}
                sub={`damlung · ${position.totalChi.toFixed(1)} chi`}
              />
              <Stat
                label="Worth now"
                value={marketValueText}
                sub={`${position.totalOz.toFixed(2)} oz`}
              />
              <Stat
                label="Up / down"
                value={gainText}
                sub={formatSignedPercent(position.unrealizedPercent)}
                tone={gainTone}
              />
            </div>

            {/* P&L bar */}
            <div className="mt-5">
              <div className="relative h-2 rounded-full bg-black/40">
                <div className="absolute left-1/2 top-0 h-full w-px bg-white/25" />
                <div
                  className={`absolute top-0 h-full rounded-full transition-all duration-500 ${
                    gainTone === "gain" ? "bg-emerald-400" : "bg-red-400"
                  }`}
                  style={{
                    width: barWidth,
                    left: gainTone === "gain" ? "50%" : undefined,
                    right: gainTone === "loss" ? "50%" : undefined,
                  }}
                />
              </div>
            </div>

            <p className="mt-5 font-mono text-[10px] leading-relaxed text-white/40">
              Indicative price for illustration only. Sign in to track a real
              ledger against the current spot rate.
            </p>

            <Link
              href={signedIn ? "/dashboard" : "/sign-up"}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:scale-[1.02] hover:bg-white/90 active:scale-95"
            >
              {signedIn ? "Open your dashboard" : "Build your real ledger"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "gain" | "loss";
}) {
  const valueColor =
    tone === "gain"
      ? "text-emerald-400"
      : tone === "loss"
        ? "text-red-400"
        : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-3.5">
      <span className="block text-[10px] uppercase tracking-wide text-white/45">
        {label}
      </span>
      <span className={`mt-1 block text-lg font-bold tabular-nums ${valueColor}`}>
        {value}
      </span>
      <span
        className={`block text-[10px] ${
          tone === "gain"
            ? "text-emerald-400/70"
            : tone === "loss"
              ? "text-red-400/70"
              : "text-white/40"
        }`}
      >
        {sub}
      </span>
    </div>
  );
}
