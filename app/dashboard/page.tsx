import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { priceFromTroyOz } from "@/lib/calc/units";
import { buildDamlungPriceSeries } from "@/lib/calc/priceHistory";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { listRecentPriceSnapshots } from "@/lib/db/queries/priceHistory";
import {
  getLatestManualSnapshot,
  getPrice,
  isManualCooldownActive,
  isSnapshotStale,
} from "@/lib/price/getPrice";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [price, transactions, recentSnapshots, latestManualSnapshot] =
    await Promise.all([
      getPrice(),
      listTransactionsForUser(userId),
      listRecentPriceSnapshots(),
      getLatestManualSnapshot(),
    ]);

  const isStale = isSnapshotStale(price);
  const canManualRefresh = !isManualCooldownActive(latestManualSnapshot);
  const chartPoints = buildDamlungPriceSeries(recentSnapshots);

  return (
    <>
      <AutoRefresh />
      <DashboardContent
        transactions={transactions}
        pricePerTroyOz={price.pricePerTroyOz}
        pricePerChi={priceFromTroyOz(price.pricePerTroyOz, "chi")}
        pricePerDamlung={priceFromTroyOz(price.pricePerTroyOz, "damlung")}
        capturedAt={price.capturedAt}
        isStale={isStale}
        canManualRefresh={canManualRefresh}
        chartPoints={chartPoints}
      />
    </>
  );
}
