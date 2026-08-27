import { auth } from "@clerk/nextjs/server";
import { priceFromTroyOz } from "@/lib/calc/units";
import { buildDamlungPriceSeries } from "@/lib/calc/priceHistory";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { listRecentPriceSnapshots } from "@/lib/db/queries/priceSnapshots";
import { getPrice } from "@/lib/price/getPrice";
import { priceFreshness } from "@/lib/price/freshness";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  // The dashboard layout (app/dashboard/layout.tsx) already gates on auth and
  // redirects unauthenticated users, so userId is non-null here. A second
  // redirect gave the Clerk dev handshake another way to bounce the route —
  // see ~/.claude/plans/dashboard-request-loop-clerk-handshake.md.
  const { userId } = await auth();
  if (!userId) return null;

  const [price, transactions, recentSnapshots] = await Promise.all([
    getPrice(),
    listTransactionsForUser(userId),
    listRecentPriceSnapshots(),
  ]);

  // One derived view of the price's age — stale treatment and the manual
  // refresh lock both read off it. The lock holds until the price on screen
  // is at least MANUAL_REFRESH_COOLDOWN_MS old, whether that price came from
  // a manual refresh or from getPrice()'s own fetch on this page load.
  const { isStale, cooldownEndsAt: refreshCooldownEndsAt } = priceFreshness(price);
  const chartPoints = buildDamlungPriceSeries(recentSnapshots);

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
      />
    </>
  );
}
