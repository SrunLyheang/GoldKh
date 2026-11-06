"use client";

import { Minus, X } from "lucide-react";
import { useId, useMemo, useRef, useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import {
  CHI_PER_DAMLUNG,
  INDICATIVE_SPOT_PER_DAMLUNG,
  computeMarketingPosition,
  formatSignedPercent,
  formatSignedUsd,
  formatUsd,
  type GoldUnit,
  type MarketingBuy,
} from "./marketing-calc";

// The landing page's one hero: an example page of the notebook that the
// visitor can write in. Each line they add is "written" onto the page,
// the sum at the bottom works itself out, and the price in the margin
// can be moved to see what the same gold would be worth at another
// price. Nothing is saved; the figures are indicative and say so.

interface Line extends MarketingBuy {
  note?: string;
  // Lines the visitor wrote get the ink animation; the example lines
  // are already on the page.
  fresh?: boolean;
}

// Example lines, priced near the indicative spot so the page reads true.
// They're labelled as an example on the page itself.
const EXAMPLE: Line[] = [
  { id: "e1", quantity: 5, unit: "chi", pricePerDamlung: 3980, note: "Mum's ring, traded in" },
  { id: "e2", quantity: 1, unit: "damlung", pricePerDamlung: 4520 },
  { id: "e3", quantity: 2, unit: "chi", pricePerDamlung: 4750, note: "for the wedding" },
];

const MAX_LINES = 8;
const SPOT_MIN = Math.round((INDICATIVE_SPOT_PER_DAMLUNG * 0.7) / 10) * 10;
const SPOT_MAX = Math.round((INDICATIVE_SPOT_PER_DAMLUNG * 1.3) / 10) * 10;
const SPOT_START = Math.round(INDICATIVE_SPOT_PER_DAMLUNG / 10) * 10;

function perUnit(line: MarketingBuy): number {
  return line.unit === "damlung"
    ? line.pricePerDamlung
    : line.pricePerDamlung / CHI_PER_DAMLUNG;
}

function weightWords(totalChi: number): string {
  const rounded = Math.round(totalChi * 100) / 100;
  const damlung = Math.floor(rounded / CHI_PER_DAMLUNG + 1e-9);
  const chi = Math.round((rounded - damlung * CHI_PER_DAMLUNG) * 100) / 100;
  const parts = [];
  if (damlung > 0) parts.push(`${damlung} damlung`);
  if (chi > 0 || damlung === 0) parts.push(`${chi} chi`);
  return parts.join(" ");
}

export function ExampleNotebook({ className }: { className?: string }) {
  const [lines, setLines] = useState<Line[]>(EXAMPLE);
  const [spot, setSpot] = useState(SPOT_START);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<GoldUnit>("chi");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const quantityRef = useRef<HTMLInputElement>(null);
  const ids = { q: useId(), p: useId(), spot: useId(), err: useId() };

  const position = useMemo(
    () => computeMarketingPosition(lines, spot),
    [lines, spot],
  );
  const up = position.unrealizedUsd >= 0;
  // Changes whenever the sum changes, so the double rule re-draws: the
  // page "totals up again".
  const sumKey = `${lines.length}-${lines.map((l) => l.id).join("")}`;

  function write(e: FormEvent) {
    e.preventDefault();
    const q = Number(quantity);
    const p = Number(price);
    if (!Number.isFinite(q) || q <= 0) {
      setError("Write how much gold — a number above zero.");
      quantityRef.current?.focus();
      return;
    }
    if (!Number.isFinite(p) || p <= 0) {
      setError(`Write what you paid for one ${unit}.`);
      return;
    }
    if (lines.length >= MAX_LINES) {
      setError("This example page is full — cross a line out first.");
      return;
    }
    const pricePerDamlung = unit === "damlung" ? p : p * CHI_PER_DAMLUNG;
    const line: Line = {
      id: `v${Date.now()}`,
      quantity: q,
      unit,
      pricePerDamlung,
      fresh: true,
    };
    setLines((current) => [...current, line]);
    setQuantity("");
    setPrice("");
    setError(null);
    setAnnouncement(
      `Written: bought ${q} ${unit} at ${formatUsd(p)} a ${unit}. The page now adds up to ${weightWords(
        computeMarketingPosition([...lines, line], spot).totalChi,
      )}.`,
    );
    quantityRef.current?.focus();
  }

  function crossOut(id: string) {
    setLines((current) => current.filter((l) => l.id !== id));
    setAnnouncement("Line crossed out.");
  }

  return (
    <div
      className={cn(
        "page page-margin relative overflow-hidden rounded-xl pb-6 pl-12 pr-5 pt-5 [--margin-x:2.25rem] sm:pl-16 sm:pr-8 sm:[--margin-x:3rem]",
        className,
      )}
    >
      {/* Binding holes down the margin: the page is torn from a real
          exercise book. Drawn, not decorative text. */}
      <div aria-hidden="true" className="absolute inset-y-6 left-3 flex flex-col justify-around sm:left-4">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className="block h-3.5 w-3.5 rounded-full bg-background shadow-[inset_0_1px_2px_rgb(0_0_0/0.45)]" />
        ))}
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="try" className="tt-heading scroll-mt-24 text-figure text-foreground">
          An example page
        </h2>
        <p className="hand -rotate-1 text-detail">try it — nothing is saved</p>
      </div>

      <ol aria-label="Lines on this page" className="mt-3">
        {lines.map((line) => (
          <li
            key={line.id}
            className="group grid min-h-(--line) grid-cols-[1fr_auto] items-baseline gap-x-3 py-1"
          >
            <span className={cn("min-w-0", line.fresh && "ink-write")}>
              <span className="text-body text-foreground">
                Bought{" "}
                <span className="font-medium tabular-nums">
                  {line.quantity} {line.unit}
                </span>{" "}
                <span className="text-muted-foreground">
                  at <span className="tabular-nums">{formatUsd(perUnit(line))}</span> a {line.unit}
                </span>
              </span>
              {line.note && (
                <span className="hand ml-2 text-detail">{line.note}</span>
              )}
            </span>
            <button
              type="button"
              onClick={() => crossOut(line.id)}
              aria-label={`Cross out: bought ${line.quantity} ${line.unit}`}
              className="press tap-target -my-1 rounded-md p-1.5 text-faint opacity-70 hover:bg-(--glow-color) hover:text-foreground hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        ))}
        {lines.length === 0 && (
          <li className="hand min-h-(--line) py-1 text-body opacity-70">
            A clean page. Write your first line below.
          </li>
        )}
      </ol>

      <form
        onSubmit={write}
        noValidate
        aria-label="Write a line"
        className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-2"
      >
        <span className="pb-2.5 text-body text-muted-foreground">Bought</span>
        <label htmlFor={ids.q} className="sr-only">
          How much gold
        </label>
        <input
          ref={quantityRef}
          id={ids.q}
          inputMode="decimal"
          placeholder="2"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          aria-invalid={error !== null && !(Number(quantity) > 0)}
          aria-describedby={error ? ids.err : undefined}
          className="h-11 w-16 rounded-md bg-sunk px-2.5 text-center text-body tabular-nums text-foreground outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div role="group" aria-label="Unit" className="flex rounded-md bg-sunk p-1">
          {(["chi", "damlung"] as const).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
              className={cn(
                "press min-h-9 rounded-sm px-2.5 text-detail font-medium",
                unit === u
                  ? "bg-popover text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.18)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {u}
            </button>
          ))}
        </div>
        <span className="pb-2.5 text-body text-muted-foreground">at $</span>
        <label htmlFor={ids.p} className="sr-only">
          Price paid for one {unit}, in US dollars
        </label>
        <input
          id={ids.p}
          inputMode="decimal"
          placeholder={unit === "chi" ? "480" : "4,800"}
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/,/g, ""))}
          aria-invalid={error !== null && Number(quantity) > 0 && !(Number(price) > 0)}
          aria-describedby={error ? ids.err : undefined}
          className="h-11 w-24 rounded-md bg-sunk px-2.5 text-body tabular-nums text-foreground outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="pb-2.5 text-body text-muted-foreground">a {unit}</span>
        <button
          type="submit"
          className="press ml-auto inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-detail font-semibold text-primary-foreground hover:bg-primary/88"
        >
          Write it down
        </button>
        {error && (
          <p id={ids.err} role="alert" className="w-full text-detail text-destructive">
            {error}
          </p>
        )}
      </form>

      {/* The sum, ruled off. */}
      <div className="mt-6">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 text-body">
          <dt className="text-muted-foreground">You’d hold</dt>
          <dd className="text-right font-medium tabular-nums">{weightWords(position.totalChi)}</dd>
          <dt className="text-muted-foreground">You paid</dt>
          <dd className="text-right tabular-nums">{formatUsd(position.totalInvestedUsd)}</dd>
          <dt className="text-muted-foreground">Average cost</dt>
          <dd className="text-right tabular-nums">
            {formatUsd(position.averageCostPerDamlung)}
            <span className="text-detail text-muted-foreground"> /damlung</span>
          </dd>
        </dl>
        <div key={sumKey} className="relative mt-2 py-2.5">
          <span aria-hidden="true" className="ink-underline absolute inset-x-0 top-0 border-t-[1.5px] border-foreground/70" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-4">
            <p className="font-serif text-figure text-foreground">Worth today</p>
            <p className="figure text-figure-lg font-semibold tabular-nums text-foreground">
              {formatUsd(position.marketValueUsd)}
            </p>
          </div>
          <p
            className={cn(
              "text-right text-detail font-medium tabular-nums",
              position.totalInvestedUsd === 0
                ? "text-faint"
                : up
                  ? "text-state-gain"
                  : "text-destructive",
            )}
          >
            {position.totalInvestedUsd === 0
              ? "—"
              : `${up ? "Up" : "Down"} ${formatSignedUsd(position.unrealizedUsd).slice(1)} (${formatSignedPercent(position.unrealizedPercent)})`}
          </p>
          <span
            aria-hidden="true"
            className="ink-underline absolute inset-x-0 bottom-0 h-[5px] border-y-[1.5px] border-foreground/70 [--ink-delay:120ms]"
          />
        </div>
      </div>

      {/* The margin note: move the price, see the same gold re-valued. */}
      <div className="mt-6 rounded-lg bg-sunk px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <label htmlFor={ids.spot} className="hand text-body">
            If gold were…
          </label>
          <output htmlFor={ids.spot} className="figure text-emphasis font-semibold tabular-nums text-foreground">
            {formatUsd(spot, 0)}
            <span className="font-sans text-detail font-normal text-muted-foreground"> a damlung</span>
          </output>
        </div>
        <input
          id={ids.spot}
          type="range"
          min={SPOT_MIN}
          max={SPOT_MAX}
          step={10}
          value={spot}
          onChange={(e) => setSpot(Number(e.target.value))}
          aria-label="Drag today's price, in US dollars a damlung"
          aria-valuetext={`${formatUsd(spot, 0)} a damlung`}
          className="notebook-range mt-1 w-full"
        />
        <div className="flex items-center justify-between gap-3 text-label text-faint">
          <span className="inline-flex items-center gap-1">
            <Minus className="h-3 w-3" aria-hidden="true" />
            30%
          </span>
          <button
            type="button"
            onClick={() => setSpot(SPOT_START)}
            disabled={spot === SPOT_START}
            className="press min-h-9 rounded-md px-2 text-label font-medium text-gold hover:bg-(--glow-color) disabled:cursor-default disabled:text-faint disabled:hover:bg-transparent"
          >
            Back to the example price
          </button>
          <span>+30%</span>
        </div>
      </div>
      <p className="mt-3 text-label text-faint">
        Indicative price for illustration only — not live. Inside GoldKh, the
        price comes from the world spot market and shows the time it was
        taken.
      </p>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
