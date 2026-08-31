"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DetailedChart,
  computeSeriesYAxis,
  mergeSeries,
  placeReferenceLine,
  type ChartSeries,
} from "@/components/charts/detailed-chart";
import { formatUsd } from "@/lib/format/money";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { useLocale } from "@/lib/i18n/locale-context";
import { Panel } from "./panel";

interface PriceHistoryChartProps {
  points: ChartPoint[];
  breakEvenPerDamlung?: number;
  // False while the spot market is closed (weekends). The line still
  // renders from the last snapshots; a badge and a note explain why it
  // hasn't moved. Defaults to open so existing call sites are unaffected.
  marketOpen?: boolean;
}

const PRICE_KEY = "pricePerDamlung";

// The dashboard's compact price chart: a section-title link and the plot
// itself both drill into /dashboard/price, where DetailedChart runs in
// full mode. The break-even ReferenceLine and the market-closed treatment
// are preserved here — the line is passed through to DetailedChart, the
// caption and badge stay local (dashboard-expansion-plan.md §D.3).
export function PriceHistoryChart({
  points,
  breakEvenPerDamlung,
  marketOpen = true,
}: PriceHistoryChartProps) {
  const { t } = useLocale();
  const router = useRouter();
  const marketClosed = marketOpen === false;

  const series: ChartSeries[] = [
    {
      key: PRICE_KEY,
      label: t.chart.spotPrice,
      color: "var(--chart-1)",
      data: points.map((p) => ({
        t: new Date(p.date).getTime(),
        value: p.pricePerDamlung,
      })),
    },
  ];

  const referenceLines =
    breakEvenPerDamlung !== undefined
      ? [
          {
            value: breakEvenPerDamlung,
            label: "avg cost",
            color: "var(--muted-foreground)",
          },
        ]
      : [];

  // The caption describes the average-cost line against the full price
  // range — the same domain DetailedChart opens at, computed with the same
  // helpers it draws with.
  const rows = mergeSeries(series);
  const breakEven =
    breakEvenPerDamlung !== undefined && rows.length >= 2
      ? placeReferenceLine(
          breakEvenPerDamlung,
          computeSeriesYAxis(rows, [PRICE_KEY]).domain,
        )
      : null;

  return (
    <Panel size="lg">
      <div className="mb-3 flex items-center gap-2">
        <Link
          href="/dashboard/price"
          className="tt-heading tt-bracket text-[15px] text-foreground transition-colors hover:text-primary"
        >
          {t.chart.title} →
        </Link>
        {marketClosed && (
          <span className="tt-bracket tt-label text-[10.5px] text-muted-foreground">
            {t.chart.marketClosed}
          </span>
        )}
      </div>

      <DetailedChart
        series={series}
        compact
        onExpand={() => router.push("/dashboard/price")}
        referenceLines={referenceLines}
        emptyLabel={t.chart.notEnoughHistory}
      />

      {breakEven && (
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          {breakEven.placement === "on-scale"
            ? `Dashed line = your average cost (${formatUsd(
                String(breakEven.actual),
              )}/damlung).`
            : `Your average cost (${formatUsd(
                String(breakEven.actual),
              )}/damlung) is ${
                breakEven.placement === "above" ? "above" : "below"
              } this range — the dashed line is pinned to the edge.`}
        </p>
      )}

      {marketClosed && (
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          {t.chart.marketClosedNote}
        </p>
      )}
    </Panel>
  );
}
