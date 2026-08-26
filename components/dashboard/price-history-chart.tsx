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

interface PriceHistoryChartProps {
  points: ChartPoint[];
  breakEvenPerDamlung?: number;
}

function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
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
        {dateLabel(point.date)}
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
}: PriceHistoryChartProps) {
  if (points.length < 2) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-border bg-card">
        <p className="text-[12.5px] text-muted-foreground">
          Not enough price history yet — check back after a few refreshes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-[15px] font-semibold text-foreground">
        Price History
      </h2>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid
              stroke="var(--border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={dateLabel}
              tick={{ fontSize: 11.5, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11.5, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={56}
              tickFormatter={(value: number) => `$${Math.round(value)}`}
              domain={([dataMin, dataMax]: readonly [number, number]) => {
                // Fixed "auto" hugs the data so tightly the line reads as
                // flat even when it moved meaningfully — pad both ends by
                // 15% of the range (or 2% of the value itself when the
                // range is ~0, e.g. only one distinct price so far).
                const range = dataMax - dataMin;
                const padding = range > 0 ? range * 0.15 : dataMax * 0.02;
                return [dataMin - padding, dataMax + padding];
              }}
            />
            <Tooltip content={<TooltipContent />} cursor={{ stroke: "var(--border)" }} />
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
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {breakEvenPerDamlung !== undefined && (
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          Dashed line = your average cost ({formatUsd(String(breakEvenPerDamlung))}/damlung).
        </p>
      )}
    </div>
  );
}
