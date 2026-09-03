import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { DetailedChart } from "@/components/charts/detailed-chart";
import { buildChartModel } from "@/components/charts/chart-model";
import { ReferenceLineCaption } from "@/components/charts/reference-line-caption";
import { Panel } from "@/components/dashboard/panel";
import { computePosition } from "@/lib/calc/position";
import { buildDamlungPriceSeries } from "@/lib/calc/priceHistory";
import { priceFromTroyOz } from "@/lib/calc/units";
import { listRecentPriceSnapshots } from "@/lib/db/queries/priceSnapshots";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { formatClockTime } from "@/lib/format/datetime";
import { formatUsd } from "@/lib/format/money";
import { dictionary } from "@/lib/i18n/dictionary";
import { getPrice } from "@/lib/price/getPrice";
import { priceFreshness } from "@/lib/price/freshness";
import { isMarketOpen } from "@/lib/price/marketHours";

// Detailed, interactive spot-price history — the drill-in from the
// dashboard's compact chart. Reads the same stored price_snapshots the
// dashboard does; the deliberate "read the ledger at request time, don't
// add a cron" choice for charts holds here too.
const t = dictionary.en;

export default async function PricePage() {
  const { userId } = await auth();
  if (!userId) return null;

  // getPrice() can append a fresh snapshot as a side effect, so the
  // snapshot list must be read after it resolves — same ordering as the
  // dashboard page.
  const [price, transactions] = await Promise.all([
    getPrice(),
    listTransactionsForUser(userId),
  ]);
  const recentSnapshots = await listRecentPriceSnapshots();

  const { isStale } = priceFreshness(price);
  const marketOpen = isMarketOpen();
  const marketClosed = !marketOpen;

  const chartPoints = buildDamlungPriceSeries(recentSnapshots);
  const pricePerDamlung = priceFromTroyOz(price.pricePerTroyOz, "damlung");

  const { breakEvenPerDamlung } = computePosition(
    transactions,
    price.pricePerTroyOz,
  );

  const series = [
    {
      key: "pricePerDamlung",
      label: t.chart.spotPrice,
      color: "var(--chart-1)",
      data: chartPoints.map((point) => ({
        t: new Date(point.date).getTime(),
        value: point.pricePerDamlung,
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

  // The caption below describes the average-cost line against the same
  // y-domain DetailedChart opens at — on-scale vs. pinned-to-edge is
  // decided here, not assumed.
  const { placedRefLine } = buildChartModel({
    series,
    referenceLine: breakEvenPerDamlung,
  });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard"
        className="tt-label text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        ← {t.chart.backToDashboard}
      </Link>

      <Panel size="lg">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
          <div>
            <h1 className="tt-heading tt-bracket text-[15px] text-foreground">
              {t.chart.title}
            </h1>
            <p className="tt-display mt-1.5 text-[28px] font-semibold leading-tight tracking-tight text-foreground tabular-nums">
              {formatUsd(pricePerDamlung)}
              <span className="ml-1 text-[13px] font-normal text-muted-foreground">
                /damlung
              </span>
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <span className="tt-label inline-flex items-center gap-1.5 rounded-full border border-(--glass-border-to) bg-(--glass-bg) px-2 py-0.5 text-[11px] text-muted-foreground">
              <span
                className={
                  isStale
                    ? "inline-block h-1.5 w-1.5 bg-muted-foreground"
                    : "inline-block h-1.5 w-1.5 bg-state-gain"
                }
              />
              <span className="tt-bracket">
                {isStale ? t.hero.stale : t.hero.live}
              </span>{" "}
              {t.chart.asOf(formatClockTime(price.capturedAt))}
            </span>
            {marketClosed && (
              <span className="tt-label text-[11px] text-muted-foreground">
                {t.chart.marketClosed}
              </span>
            )}
          </div>
        </div>

        <DetailedChart series={series} referenceLines={referenceLines} />

        {placedRefLine && <ReferenceLineCaption placed={placedRefLine} />}
        {marketClosed && (
          <p className="mt-2 text-[11.5px] text-muted-foreground">
            {t.chart.marketClosedNote}
          </p>
        )}
      </Panel>
    </div>
  );
}
