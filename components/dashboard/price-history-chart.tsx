"use client";

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
import { formatUsd } from "@/lib/format/money";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { useLocale } from "@/lib/i18n/locale-context";

interface PriceHistoryChartProps {
  points: ChartPoint[];
  breakEvenPerDamlung?: number;
  // False while the spot market is closed (weekends). The line still
  // renders from the last snapshots; a badge and a note explain why it
  // hasn't moved. Defaults to open so existing call sites are unaffected.
  marketOpen?: boolean;
}
// "Nice" step sizes to pick from when sizing y-axis gridlines.
const NICE_STEPS = [5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
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

function computeYAxis(
  points: ChartPoint[],
  breakEvenPerDamlung?: number,
): {
  domain: [number, number];
  ticks: number[];
} {
  const values = points.map((p) => p.pricePerDamlung);
  if (breakEvenPerDamlung !== undefined) {
    values.push(breakEvenPerDamlung);
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

function makeDateLabel(points: ChartPoint[]): (iso: string) => string {
  const times = points.map((p) => new Date(p.date).getTime());
  const spanMs = Math.max(...times) - Math.min(...times);
  const oneDay = 24 * 60 * 60 * 1000;

  if (spanMs < oneDay) {
    return (iso: string) =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(iso));
  }
  if (spanMs < 3 * oneDay) {
    return (iso: string) =>
      new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
      }).format(new Date(iso));
  }
  return (iso: string) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
}

function tooltipDateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

function TooltipContent({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-popover-foreground shadow-none">
      <p className="font-mono text-[12px] tabular-nums text-muted-foreground">
        {tooltipDateLabel(point.date)}
      </p>
      <p className="font-mono text-[13.5px] font-semibold tabular-nums text-foreground">
        {formatUsd(String(point.pricePerDamlung))}/damlung
      </p>
    </div>
  );
}

export function PriceHistoryChart({
  points,
  breakEvenPerDamlung,
  marketOpen = true,
}: PriceHistoryChartProps) {
  const { t } = useLocale();
  const marketClosed = marketOpen === false;

  const marketClosedBadge = marketClosed ? (
    <span className="tt-bracket tt-label text-[10.5px] text-muted-foreground">
      {t.chart.marketClosed}
    </span>
  ) : null;

  const marketClosedNote = marketClosed ? (
    <p className="mt-2 text-[11.5px] text-muted-foreground">
      {t.chart.marketClosedNote}
    </p>
  ) : null;

  if (points.length < 2) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="tt-heading tt-bracket text-[15px] text-foreground">
            Price History
          </h2>
          {marketClosedBadge}
        </div>
        <div className="flex h-60 items-center justify-center">
          <p className="text-[12.5px] text-muted-foreground">
            {t.chart.notEnoughHistory}
          </p>
        </div>
        {marketClosedNote}
      </div>
    );
  }

  const { domain, ticks } = computeYAxis(points, breakEvenPerDamlung);
  const xAxisDateLabel = makeDateLabel(points);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="tt-heading tt-bracket text-[15px] text-foreground">
          Price History
        </h2>
        {marketClosedBadge}
      </div>
      <div className="h-70 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={xAxisDateLabel}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => `$${Math.round(value)}`}
              domain={domain}
              ticks={ticks}
            />
            <Tooltip
              content={<TooltipContent />}
              cursor={{ stroke: "var(--border)" }}
            />
            {breakEvenPerDamlung !== undefined && (
              <ReferenceLine
                y={breakEvenPerDamlung}
                stroke="var(--muted-foreground)"
                strokeDasharray="6 5"
                strokeWidth={1.5}
              />
            )}
            <Line
              type="monotone"
              dataKey="pricePerDamlung"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {breakEvenPerDamlung !== undefined && (
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          Dashed line = your average cost (
          {formatUsd(String(breakEvenPerDamlung))}/damlung).
        </p>
      )}
      {marketClosedNote}
    </div>
  );
}
