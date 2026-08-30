import { auth } from "@clerk/nextjs/server";
import { priceFromTroyOz } from "@/lib/calc/units";
import { buildDamlungPriceSeries } from "@/lib/calc/priceHistory";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { listRecentPriceSnapshots } from "@/lib/db/queries/priceSnapshots";
import { getPrice } from "@/lib/price/getPrice";
import { priceFreshness } from "@/lib/price/freshness";
import { isMarketOpen } from "@/lib/price/marketHours";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  // The dashboard layout (app/dashboard/layout.tsx) already gates on auth and
  // redirects unauthenticated users, so userId is non-null here. A second
  // redirect gave the Clerk dev handshake another way to bounce the route —
  // see ~/.claude/plans/dashboard-request-loop-clerk-handshake.md.
  const { userId } = await auth();
  if (!userId) return null;

  // getPrice() can append a new row to price_snapshots as a side effect when
  // the cached price is stale. listRecentPriceSnapshots() must run *after* it
  // resolves, or the chart is built from a snapshot list that's missing the
  // row getPrice() just wrote — the hero price updates but the graph doesn't
  // until the next refresh. Transactions have no such dependency.
  const [price, transactions] = await Promise.all([
    getPrice(),
    listTransactionsForUser(userId),
  ]);
  const recentSnapshots = await listRecentPriceSnapshots();

  // One derived view of the price's age — stale treatment and the manual
  // refresh lock both read off it. The lock holds until the price on screen
  // is at least MANUAL_REFRESH_COOLDOWN_MS old, whether that price came from
  // a manual refresh or from getPrice()'s own fetch on this page load.
  const { isStale, cooldownEndsAt: refreshCooldownEndsAt } = priceFreshness(price);
  const chartPoints = buildDamlungPriceSeries(recentSnapshots);
  // Weekends: goldapi.io only echoes Friday's close, so getPrice() above
  // already skipped it. The UI switches to a "market closed" treatment.
  const marketOpen = isMarketOpen();

  return (
    <>
      <AutoRefresh capturedAt={price.capturedAt} />
      <DashboardContent
        transactions={transactions}
        pricePerTroyOz={price.pricePerTroyOz}
        pricePerChi={priceFromTroyOz(price.pricePerTroyOz, "chi")}
        pricePerDamlung={priceFromTroyOz(price.pricePerTroyOz, "damlung")}
        capturedAt={price.capturedAt}
        isStale={isStale}
        chartPoints={chartPoints}
        refreshCooldownEndsAt={refreshCooldownEndsAt}
        marketOpen={marketOpen}
      />
    </>
  );
}
