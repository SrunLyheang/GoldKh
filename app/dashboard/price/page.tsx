import { auth } from "@clerk/nextjs/server";
import { DetailedChart } from "@/components/charts/detailed-chart";
import { buildChartModel } from "@/components/charts/chart-model";
import { ReferenceLineCaption } from "@/components/charts/reference-line-caption";
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
    <section
      aria-labelledby="price-title"
      className="dash-enter page page--plain px-5 pb-6 pt-6 sm:px-10 sm:pt-8"
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 id="price-title" className="tt-heading text-figure-lg text-foreground">
            {t.chart.title}
          </h1>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <span className="tt-display text-display font-semibold leading-none text-foreground">
              {formatUsd(pricePerDamlung)}
            </span>
            <span className="font-serif text-emphasis text-muted-foreground">
              a damlung
            </span>
          </p>
        </div>
        <div className="flex flex-col items-start gap-0.5 sm:items-end">
          <p className="flex items-center gap-2 text-label text-muted-foreground">
            <span
              aria-hidden="true"
              className={
                isStale
                  ? "inline-block h-2 w-2 rounded-full bg-faint"
                  : "inline-block h-2 w-2 rounded-full bg-state-gain"
              }
            />
            <span className="font-medium text-foreground/90">
              {isStale ? t.hero.stale : t.hero.live}
            </span>
            {t.chart.asOf(formatClockTime(price.capturedAt))}
          </p>
          {marketClosed && (
            <p className="text-label text-muted-foreground">{t.chart.marketClosed}</p>
          )}
        </div>
      </div>

      <DetailedChart series={series} referenceLines={referenceLines} />

      {placedRefLine && <ReferenceLineCaption placed={placedRefLine} />}
      {marketClosed && (
        <p className="mt-2 text-label text-muted-foreground">
          {t.chart.marketClosedNote}
        </p>
      )}
      <p className="mt-4 max-w-[60ch] text-label text-faint">{t.hero.disclaimer}</p>
    </section>
  );
}
