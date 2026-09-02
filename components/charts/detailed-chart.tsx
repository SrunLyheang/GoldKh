"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DISPLAY_TIME_ZONE } from "@/lib/format/datetime";
import { formatUsd } from "@/lib/format/money";
import { t } from "@/lib/i18n/dictionary";
import { notify } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";
import { CHART_DRAW_MS } from "@/components/motion/motion";

// Reusable interactive time-series chart: /dashboard/price (full), the
// dashboard compact chart, and Insights' portfolio chart (two series).
// Recharts <Brush> for drag-to-range; y-domain recomputed from the visible
// slice; range presets hand-wired off Date.now(), clamped to history.

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  data: { t: number; value: number }[];
}

export interface ChartReferenceLine {
  value: number;
  // `${label} ↑`/`↓` only when the line is off-scale; on-scale lines are
  // unlabelled (caller writes its own caption).
  label: string;
  color?: string;
}

interface DetailedChartProps {
  series: ChartSeries[];
  // `compact` is layout only (height + drill-in target). Whether presets /
  // caption / tooltip show is `richControls` (defaults to `!compact`, but
  // forceable on for an inline chart like the Insights portfolio chart).
  compact?: boolean;
  richControls?: boolean;
  // Draw-on animation, first mount only. Defaults on; off under
  // `prefers-reduced-motion`.
  animate?: boolean;
  onExpand?: () => void;
  referenceLines?: ChartReferenceLine[];
  yTickFormatter?: (value: number) => string;
  valueFormatter?: (value: number) => string;
  emptyLabel?: string;
  className?: string;
}

export interface MergedRow {
  t: number;
  [seriesKey: string]: number;
}

// Collapse N sparse {t,value} series onto one timestamp-keyed row array so a
// single <LineChart> draws them all and <Brush> has one index space.
export function mergeSeries(series: ChartSeries[]): MergedRow[] {
  const byT = new Map<number, MergedRow>();
  for (const s of series) {
    for (const point of s.data) {
      const row = byT.get(point.t) ?? { t: point.t };
      row[s.key] = point.value;
      byT.set(point.t, row);
    }
  }
  return Array.from(byT.values()).sort((a, b) => a.t - b.t);
}

const NICE_STEPS = [
  5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000,
];
const TARGET_TICK_COUNT = 5;

function niceStep(range: number): number {
  if (range <= 0) {
    return NICE_STEPS[0];
  }
  const rough = range / TARGET_TICK_COUNT;
  return (
    NICE_STEPS.find((step) => step >= rough) ?? NICE_STEPS[NICE_STEPS.length - 1]
  );
}

// Domain sized from visible series values alone — reference lines excluded,
// since a fat-fingered average-cost line would otherwise flatten the real
// line to a sliver. Off-scale reference lines are clamped by placeReferenceLine.
export function computeSeriesYAxis(
  rows: MergedRow[],
  keys: string[],
): { domain: [number, number]; ticks: number[] } {
  const values: number[] = [];
  for (const row of rows) {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === "number" && Number.isFinite(value)) {
        values.push(value);
      }
    }
  }
  if (values.length === 0) {
    return { domain: [0, 1], ticks: [0, 1] };
  }

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const range = dataMax - dataMin;
  const step = niceStep(range);
  const padding = Math.max(range * 0.1, step * 0.5);
  const domainMin = dataMin - padding;
  const domainMax = dataMax + padding;

  const firstTick = Math.floor(domainMin / step) * step;
  const lastTick = Math.ceil(domainMax / step) * step;
  const ticks: number[] = [];
  for (let tick = firstTick; tick <= lastTick; tick += step) {
    ticks.push(tick);
  }

  return { domain: [domainMin, domainMax], ticks };
}

export type RefPlacement = "on-scale" | "above" | "below";

export function placeReferenceLine(
  value: number,
  [domainMin, domainMax]: [number, number],
): { actual: number; y: number; placement: RefPlacement } {
  if (value > domainMax) {
    return { actual: value, y: domainMax, placement: "above" };
  }
  if (value < domainMin) {
    return { actual: value, y: domainMin, placement: "below" };
  }
  return { actual: value, y: value, placement: "on-scale" };
}

export const PRESET_WINDOWS_MS = {
  "1W": 7 * 24 * 60 * 60 * 1000,
  "1M": 30 * 24 * 60 * 60 * 1000,
  "3M": 90 * 24 * 60 * 60 * 1000,
} as const;

export type PresetKey = keyof typeof PRESET_WINDOWS_MS | "All";

const PRESET_ORDER: PresetKey[] = ["1W", "1M", "3M", "All"];

// [startIndex, endIndex] into `rows` for a preset window ending now. "All" or
// any window past the earliest datum clamps to the full range — no backfill.
export function presetRange(
  rows: MergedRow[],
  preset: PresetKey,
  now: number = Date.now(),
): [number, number] {
  const lastIndex = Math.max(0, rows.length - 1);
  if (preset === "All" || rows.length === 0) {
    return [0, lastIndex];
  }
  const cutoff = now - PRESET_WINDOWS_MS[preset];
  if (cutoff <= rows[0].t) {
    return [0, lastIndex];
  }
  const start = rows.findIndex((row) => row.t >= cutoff);
  return [start < 0 ? lastIndex : start, lastIndex];
}

// True when a preset's window already spans the whole dataset (same as
// "All") — the full-mode UI disables that button.
export function presetCoversAll(
  rows: MergedRow[],
  preset: PresetKey,
  now: number = Date.now(),
): boolean {
  if (preset === "All" || rows.length === 0) {
    return true;
  }
  return now - PRESET_WINDOWS_MS[preset] <= rows[0].t;
}

function formatAxisTime(t: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(t));
}

function formatTooltipTime(t: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(t));
}

function DetailedTooltip({
  active,
  payload,
  label,
  series,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: number;
  series: ChartSeries[];
  valueFormatter: (value: number) => string;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  return (
    <div className="glass-overlay rounded-md px-3 py-2 text-popover-foreground">
      <p className="font-mono text-[12px] tabular-nums text-muted-foreground">
        {typeof label === "number" ? formatTooltipTime(label) : ""}
      </p>
      {payload.map((entry) => {
        const matched = series.find((s) => s.key === entry.dataKey);
        return (
          <p
            key={entry.dataKey}
            className="font-mono text-[13px] font-semibold tabular-nums text-foreground"
          >
            {series.length > 1 && matched ? `${matched.label}: ` : ""}
            {valueFormatter(entry.value)}
          </p>
        );
      })}
    </div>
  );
}

export function DetailedChart({
  series,
  compact = false,
  richControls,
  animate = true,
  onExpand,
  referenceLines = [],
  yTickFormatter = (value) => `$${Math.round(value)}`,
  valueFormatter = (value) => formatUsd(String(value)),
  emptyLabel,
  className,
}: DetailedChartProps) {
  const reduceMotion = useReducedMotion();
  const showControls = richControls ?? !compact;

  // Draw-on runs on first mount only; the flag then flips so later
  // preset re-renders redraw instantly.
  const [hasDrawn, setHasDrawn] = useState(false);
  useEffect(() => {
    // One-shot settle-in-effect (same pattern as ThemeProvider).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasDrawn(true);
  }, []);
  const drawOn = animate && !reduceMotion && !hasDrawn;

  const rows = useMemo(() => mergeSeries(series), [series]);
  const keys = useMemo(() => series.map((s) => s.key), [series]);

  // Y-domain is fixed to the whole history, not the visible slice: the plot
  // is now panned by horizontal scroll (below), and a domain that refit on
  // every scroll frame would make the line jump under the reader's finger.
  const { domain, ticks } = useMemo(
    () => computeSeriesYAxis(rows, keys),
    [rows, keys],
  );

  // A preset no longer slices the data — it sets how many points should fill
  // the frame, i.e. how wide the plot is drawn ("zoom"); the reader scrolls
  // through the rest. Even "All" stays scrollable once history outgrows a
  // readable density (~90 points across the frame). Short history → 1×, fits.
  const [activePreset, setActivePreset] = useState<PresetKey | null>("All");
  const zoom = useMemo(() => {
    if (!showControls) return 1;
    const target =
      activePreset && activePreset !== "All"
        ? Math.max(
            presetRange(rows, activePreset)[1] -
              presetRange(rows, activePreset)[0] +
              1,
            6,
          )
        : 90;
    return Math.min(Math.max(rows.length / target, 1), 12);
  }, [showControls, activePreset, rows]);

  // Inline charts with the full toolset get more plot height than a bare
  // preview, but stay short of the standalone route.
  const height = compact ? (showControls ? 280 : 220) : 360;

  // Pinned y-axis geometry — mirrors the Recharts <LineChart> margins so the
  // HTML tick labels line up with the scrolling plot's grid lines.
  const Y_AXIS_W = 56;
  const X_AXIS_H = 24;
  const M_TOP = 4;
  const plotSpan = height - X_AXIS_H - M_TOP;
  const yPos = (value: number) =>
    M_TOP +
    (1 - (value - domain[0]) / (domain[1] - domain[0] || 1)) * plotSpan;

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Anchor the view to the most recent data whenever the zoom changes or a
  // new snapshot lands (rows grows).
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [zoom, rows.length]);

  // Desktop has no natural horizontal-scroll gesture, so give the scroller a
  // grab-drag and translate vertical wheel to horizontal pan. Touch keeps the
  // native momentum scroll (touch-action: pan-x) and skips this entirely.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !window.matchMedia?.("(pointer: fine)").matches) return;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    const onDown = (e: PointerEvent) => {
      down = true;
      startX = e.clientX;
      startLeft = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (down) el.scrollLeft = startLeft - (e.clientX - startX);
    };
    const onUp = (e: PointerEvent) => {
      down = false;
      el.style.cursor = "grab";
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      // Leave a plain vertical wheel to the page; only pan on a horizontal
      // (trackpad) or shift-wheel gesture.
      if (!e.shiftKey && Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaX || e.deltaY;
    };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
    };
  }, [zoom]);

  if (rows.length < 2) {
    return (
      <div
        className={cn("flex items-center justify-center", className)}
        style={{ height }}
      >
        <p className="text-[12.5px] text-muted-foreground">
          {emptyLabel ?? t.chart.notEnoughHistory}
        </p>
      </div>
    );
  }

  const presetLabel: Record<PresetKey, string> = {
    "1W": t.chart.range1W,
    "1M": t.chart.range1M,
    "3M": t.chart.range3M,
    All: t.chart.rangeAll,
  };

  const rangeCaption = t.chart.showingRange(
    formatAxisTime(rows[0].t),
    formatAxisTime(rows[rows.length - 1].t),
  );

  const chartBody = (pinnedAxis: boolean) => (
    <LineChart data={rows} margin={{ top: M_TOP, right: 8, bottom: 0, left: 0 }}>
      <CartesianGrid
        stroke="var(--glass-border-to)"
        strokeDasharray="3 3"
        vertical={false}
      />
      <XAxis
        dataKey="t"
        type="number"
        scale="time"
        domain={["dataMin", "dataMax"]}
        tickFormatter={formatAxisTime}
        tick={{
          fontSize: 11,
          fill: "var(--muted-foreground)",
          fontFamily: "var(--font-mono)",
        }}
        tickLine={false}
        axisLine={false}
        minTickGap={40}
        height={pinnedAxis ? X_AXIS_H : undefined}
      />
      <YAxis
        hide={pinnedAxis}
        tick={{
          fontSize: 11,
          fill: "var(--muted-foreground)",
          fontFamily: "var(--font-mono)",
        }}
        tickLine={false}
        axisLine={false}
        width={Y_AXIS_W}
        tickFormatter={yTickFormatter}
        domain={domain}
        ticks={ticks}
      />
      {showControls && (
        <Tooltip
          content={
            <DetailedTooltip series={series} valueFormatter={valueFormatter} />
          }
          cursor={{ stroke: "var(--glass-border-to)" }}
        />
      )}
      {referenceLines.map((ref, index) => {
        const placed = placeReferenceLine(ref.value, domain);
        return (
          <ReferenceLine
            key={`${ref.label}-${index}`}
            y={placed.y}
            stroke={ref.color ?? "var(--muted-foreground)"}
            strokeDasharray={placed.placement === "on-scale" ? "6 5" : "2 3"}
            strokeWidth={1.5}
            label={
              placed.placement === "on-scale"
                ? undefined
                : {
                    value:
                      placed.placement === "above"
                        ? `${ref.label} ↑`
                        : `${ref.label} ↓`,
                    position:
                      placed.placement === "above"
                        ? "insideTopLeft"
                        : "insideBottomLeft",
                    fill: "var(--muted-foreground)",
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                  }
            }
          />
        );
      })}
      {series.map((s) => (
        <Line
          key={s.key}
          type="monotone"
          dataKey={s.key}
          stroke={s.color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls
          isAnimationActive={drawOn}
          animationDuration={CHART_DRAW_MS}
          animationEasing="ease-out"
        />
      ))}
    </LineChart>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {showControls && (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="group"
              aria-label={t.chart.rangeLabel}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-accent/60 p-0.5"
            >
              {PRESET_ORDER.map((preset) => {
                // A window longer than stored history shows nothing extra
                // (no backfill), so it reads as disabled and explains itself
                // via a toast rather than silently mirroring "All".
                const outOfRange =
                  preset !== "All" && presetCoversAll(rows, preset);
                const active = activePreset === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    aria-pressed={active}
                    aria-disabled={outOfRange || undefined}
                    onClick={() => {
                      if (outOfRange) {
                        notify.info(t.chart.historyShorterThanRange);
                        return;
                      }
                      setActivePreset(preset);
                    }}
                    className={cn(
                      "tt-label rounded-md px-2.5 py-1 text-[10.5px] transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                      outOfRange && !active && "opacity-35",
                    )}
                  >
                    {presetLabel[preset]}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="text-label text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">
              {rangeCaption}
            </span>
          </p>
        </div>
      )}

      {compact && onExpand && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onExpand}
            className="tt-label inline-flex items-center gap-1 rounded-sm border border-border px-2 py-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {t.chart.expand} ↗
          </button>
        </div>
      )}

      <div className="relative w-full" style={{ height }}>
        {compact && onExpand && (
          <button
            type="button"
            aria-label={t.chart.openDetailed}
            onClick={onExpand}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        )}

        {showControls ? (
          <>
            {/* Pinned y-axis: HTML labels positioned off the shared domain,
                so they hold still while the plot scrolls beneath them. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10"
              style={{ width: Y_AXIS_W }}
            >
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute right-2 -translate-y-1/2 font-mono text-label tabular-nums text-muted-foreground"
                  style={{ top: yPos(tick) }}
                >
                  {yTickFormatter(tick)}
                </span>
              ))}
            </div>
            <div
              ref={scrollerRef}
              className="absolute inset-y-0 right-0 select-none overflow-x-auto overflow-y-hidden"
              style={{ left: Y_AXIS_W, touchAction: "pan-x" }}
            >
              <div style={{ width: `${zoom * 100}%`, height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  {chartBody(true)}
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartBody(false)}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
