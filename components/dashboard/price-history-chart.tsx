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
    <section
      aria-labelledby="price-history"
      className="page page--plain px-5 pb-6 pt-5 sm:px-10 sm:pt-7"
    >
      <div className="-mb-9 max-w-[calc(100%-7rem)]">
        <h2 id="price-history" className="tt-heading text-figure text-foreground">
          <Link
            href="/dashboard/price"
            className="rounded-sm transition-colors duration-(--dur-micro) hover:text-gold"
          >
            {t.chart.title} <span aria-hidden="true">→</span>
          </Link>
        </h2>
        <p className="mt-0.5 text-label text-faint">
          {marketClosed ? t.chart.marketClosed : t.chart.perDamlungCaption}
        </p>
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
        <p className="mt-2 text-label text-muted-foreground">
          {t.chart.marketClosedNote}
        </p>
      )}
    </section>
  );
}
