"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  Brush,
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
    NICE_STEPS.find((step) => step >= rough) ??
    NICE_STEPS[NICE_STEPS.length - 1]
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
  // range/preset re-renders redraw instantly.
  const [hasDrawn, setHasDrawn] = useState(false);
  useEffect(() => {
    // One-shot settle-in-effect (same pattern as ThemeProvider).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasDrawn(true);
  }, []);
  const drawOn = animate && !reduceMotion && !hasDrawn;

  const rows = useMemo(() => mergeSeries(series), [series]);
  const keys = useMemo(() => series.map((s) => s.key), [series]);

  // Recharts 3's <Brush> divides by the plot width to place its travellers;
  // on first mount ResponsiveContainer briefly reports width 0 before its
  // ResizeObserver fires, so that math yields NaN and React warns about a
  // NaN `x` on the traveller <rect>. Gate the Brush on a sane width.
  const [plotWidth, setPlotWidth] = useState(0);

  const lastIndex = Math.max(0, rows.length - 1);
  const [range, setRange] = useState<[number, number] | null>(null);
  const [activePreset, setActivePreset] = useState<PresetKey | null>("All");

  const [rawStart, rawEnd] = range ?? [0, lastIndex];
  const startIndex = Math.min(Math.max(0, rawStart), lastIndex);
  const endIndex = Math.min(Math.max(startIndex, rawEnd), lastIndex);

  const visibleRows = rows.slice(startIndex, endIndex + 1);
  const { domain, ticks } = useMemo(
    () =>
      computeSeriesYAxis(visibleRows.length >= 2 ? visibleRows : rows, keys),
    [visibleRows, rows, keys],
  );

  // Inline charts with the full toolset get more plot height than a bare
  // preview, but stay short of the standalone route.
  const height = compact ? (showControls ? 280 : 220) : 360;
  // Taller strip when presets show, so the drag handles read as a control.
  const brushHeight = showControls ? 28 : 16;

  // Drag-to-pan straight on the plot — the phone gesture people expect,
  // without having to hit the thin Brush strip. Horizontal drags shift the
  // visible index window; vertical drags and taps fall through untouched so
  // the page still scrolls and the tooltip still opens. Only armed while
  // zoomed in (nothing to pan at full range).
  const plotBoxRef = useRef<HTMLDivElement>(null);
  const panLive = useRef({ startIndex, endIndex, lastIndex, plotWidth });
  useEffect(() => {
    panLive.current = { startIndex, endIndex, lastIndex, plotWidth };
  });
  useEffect(() => {
    const el = plotBoxRef.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    let s = 0;
    let e0 = 0;
    let on = false;
    let axis: "?" | "x" | "y" = "?";
    const onStart = (ev: TouchEvent) => {
      const target = ev.target as Element;
      if (ev.touches.length !== 1 || target.closest?.(".recharts-brush"))
        return;
      const { startIndex: si, endIndex: ei } = panLive.current;
      if (si <= 0 && ei >= panLive.current.lastIndex) return; // not zoomed
      sx = ev.touches[0].clientX;
      sy = ev.touches[0].clientY;
      s = si;
      e0 = ei;
      on = true;
      axis = "?";
    };
    const onMove = (ev: TouchEvent) => {
      if (!on) return;
      const dx = ev.touches[0].clientX - sx;
      const dy = ev.touches[0].clientY - sy;
      if (axis === "?") {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axis !== "x") return;
      ev.preventDefault();
      const { lastIndex: li, plotWidth: pw } = panLive.current;
      const span = e0 - s;
      const plot = Math.max(1, pw - 64); // minus y-axis (56) + right margin (8)
      const shift = Math.round((-dx / plot) * span);
      let ns = s + shift;
      let ne = e0 + shift;
      if (ns < 0) {
        ne -= ns;
        ns = 0;
      }
      if (ne > li) {
        ns -= ne - li;
        ne = li;
      }
      setRange([ns, ne]);
      setActivePreset(null);
    };
    const onEnd = () => {
      on = false;
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, []);

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

  const fullRange: [number, number] = [0, lastIndex];
  const isZoomed = startIndex > 0 || endIndex < lastIndex;

  function applyPreset(preset: PresetKey) {
    setActivePreset(preset);
    setRange(presetRange(rows, preset));
  }

  function resetZoom() {
    setActivePreset("All");
    setRange(fullRange);
  }

  const presetLabel: Record<PresetKey, string> = {
    "1W": t.chart.range1W,
    "1M": t.chart.range1M,
    "3M": t.chart.range3M,
    All: t.chart.rangeAll,
  };

  const rangeCaption = t.chart.showingRange(
    formatAxisTime(rows[startIndex].t),
    formatAxisTime(rows[endIndex].t),
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
                      applyPreset(preset);
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
            {isZoomed && (
              <button
                type="button"
                onClick={resetZoom}
                className="tt-label rounded-md border border-border px-2.5 py-1 text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.chart.reset}
              </button>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground">
              {rangeCaption}
            </span>
            <span className="mx-1.5 text-border">·</span>
            {t.chart.zoomHint}
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

      <div
        ref={plotBoxRef}
        className="relative w-full"
        style={{ height, touchAction: "pan-y" }}
      >
        {compact && onExpand && (
          // Transparent click target over the plot only — leaves the Brush
          // strip uncovered so drag-to-zoom still works.
          <button
            type="button"
            aria-label={t.chart.openDetailed}
            onClick={onExpand}
            className="absolute inset-x-0 top-0 z-10 cursor-pointer"
            style={{ bottom: brushHeight }}
          />
        )}
        <ResponsiveContainer
          width="100%"
          height="100%"
          onResize={(w) => setPlotWidth(w)}
        >
          <LineChart
            data={rows}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
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
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)",
              }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={yTickFormatter}
              domain={domain}
              ticks={ticks}
            />
            {showControls && (
              <Tooltip
                content={
                  <DetailedTooltip
                    series={series}
                    valueFormatter={valueFormatter}
                  />
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
                  strokeDasharray={
                    placed.placement === "on-scale" ? "6 5" : "2 3"
                  }
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
            {plotWidth > 120 && (
              // Keyed on row count: when a new snapshot lands mid-session
              // and `rows` grows, Brush's own state (built for the old
              // length) briefly evaluates the new startIndex/endIndex
              // outside its stale domain and renders NaN travellers. A
              // fresh key forces a clean remount instead of patching that
              // reconciliation gap in recharts itself.
              <Brush
                key={rows.length}
                dataKey="t"
                height={brushHeight}
                stroke="var(--muted-foreground)"
                fill="var(--muted)"
                fillOpacity={0.2}
                travellerWidth={8}
                tickFormatter={formatAxisTime}
                startIndex={startIndex}
                endIndex={endIndex}
                onChange={(next: {
                  startIndex?: number;
                  endIndex?: number;
                }) => {
                  if (
                    typeof next.startIndex === "number" &&
                    typeof next.endIndex === "number"
                  ) {
                    setRange([next.startIndex, next.endIndex]);
                    setActivePreset(null);
                  }
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
