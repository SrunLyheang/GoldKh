"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DetailedChart,
  buildChartModel,
  type ChartSeries,
} from "@/components/charts/detailed-chart";
import { ReferenceLineCaption } from "@/components/charts/reference-line-caption";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { t } from "@/lib/i18n/dictionary";
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
// caption and badge stay local.
export function PriceHistoryChart({
  points,
  breakEvenPerDamlung,
  marketOpen = true,
}: PriceHistoryChartProps) {
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
            label: "Avg cost",
            color: "var(--muted-foreground)",
          },
        ]
      : [];

  // The caption describes the average-cost line against the same y-domain
  // DetailedChart opens at — one shared computation.
  const { placedRefLine: breakEven } = buildChartModel({
    series,
    referenceLine: breakEvenPerDamlung,
  });

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
          <span className="tt-bracket tt-label text-[11px] text-muted-foreground">
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

      {breakEven && <ReferenceLineCaption placed={breakEven} />}

      {marketClosed && (
        <p className="mt-2 text-[11.5px] text-muted-foreground">
          {t.chart.marketClosedNote}
        </p>
      )}
    </Panel>
  );
}
