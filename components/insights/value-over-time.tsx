"use client";

import {
  DetailedChart,
  type ChartSeries,
} from "@/components/charts/detailed-chart";
import type { PortfolioSeriesPoint } from "@/lib/calc/portfolioSeries";
import { t } from "@/lib/i18n/dictionary";

interface ValueOverTimeProps {
  points: PortfolioSeriesPoint[];
}

// Portfolio market value vs cost basis over time. Wraps the shared
// DetailedChart inline in compact mode — no onExpand, no route, because
// this is the user's own position, not spot price. Fewer than 2 points
// falls through to DetailedChart's own empty state.
export function ValueOverTime({ points }: ValueOverTimeProps) {

  const series: ChartSeries[] = [
    {
      key: "marketValue",
      label: t.insights.marketValue,
      color: "var(--chart-1)",
      data: points.map((p) => ({ t: p.t, value: Number(p.marketValueUsd) })),
    },
    {
      key: "costBasis",
      label: t.insights.costBasis,
      color: "var(--chart-2)",
      data: points.map((p) => ({ t: p.t, value: Number(p.costBasisUsd) })),
    },
  ];

  return (
    <DetailedChart
      series={series}
      compact
      richControls
      emptyLabel={t.insights.notEnoughData}
    />
  );
}
