// Pure chart geometry — no React, no "use client". Lives apart from
// detailed-chart.tsx so a server component (app/dashboard/price/page.tsx)
// can call buildChartModel for its caption without pulling the client
// bundle across the boundary. detailed-chart.tsx re-exports everything
// here, so existing importers keep one entry point.

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

// What a caption rendered next to the chart needs to say the same thing
// the chart shows: the merged rows, the y-domain DetailedChart opens at
// (computeSeriesYAxis over the full series — the visible slice starts as
// the whole range), and where a single reference line lands against it.
// `placedRefLine` is null when there is no line or too little history to
// draw one.
export interface ChartModel {
  series: ChartSeries[];
  rows: MergedRow[];
  domain: [number, number];
  placedRefLine: ReturnType<typeof placeReferenceLine> | null;
}

export function buildChartModel({
  series,
  referenceLine,
}: {
  series: ChartSeries[];
  referenceLine?: number;
}): ChartModel {
  const rows = mergeSeries(series);
  const { domain } = computeSeriesYAxis(
    rows,
    series.map((s) => s.key),
  );
  const placedRefLine =
    referenceLine !== undefined && rows.length >= 2
      ? placeReferenceLine(referenceLine, domain)
      : null;
  return { series, rows, domain, placedRefLine };
}
