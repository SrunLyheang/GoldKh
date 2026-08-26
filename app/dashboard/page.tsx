import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { computeGainLoss } from "@/lib/calc/gainLoss";
import { computeHoldings } from "@/lib/calc/holdings";
import { fromTroyOz, priceFromTroyOz } from "@/lib/calc/units";
import { buildDamlungPriceSeries } from "@/lib/calc/priceHistory";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { listRecentPriceSnapshots } from "@/lib/db/queries/priceHistory";
import { getPrice, isSnapshotStale } from "@/lib/price/getPrice";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { EmptyState } from "@/components/dashboard/empty-state";
import { HeroPriceCard } from "@/components/dashboard/hero-price-card";
import { PriceHistoryChart } from "@/components/dashboard/price-history-chart";
import { StatRow } from "@/components/dashboard/stat-row";
import { TransactionHistory } from "@/components/dashboard/transaction-history";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const [price, transactions, recentSnapshots] = await Promise.all([
    getPrice(),
    listTransactionsForUser(userId),
    listRecentPriceSnapshots(),
  ]);

  const holdings = computeHoldings(transactions);
  const gainLoss = computeGainLoss(
    holdings.totalTroyOz,
    holdings.averageCostPerTroyOz,
    price.pricePerTroyOz
  );

  const isStale = isSnapshotStale(price);
  const hasHoldings = Number(holdings.totalTroyOz) > 0;
  const chartPoints = buildDamlungPriceSeries(recentSnapshots);

  return (
    <div className="flex flex-col gap-6.5">
      <AutoRefresh />
      <HeroPriceCard
        pricePerTroyOz={price.pricePerTroyOz}
        pricePerChi={priceFromTroyOz(price.pricePerTroyOz, "chi")}
        pricePerDamlung={priceFromTroyOz(price.pricePerTroyOz, "damlung")}
        capturedAt={price.capturedAt}
        isStale={isStale}
      />

      {transactions.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <StatRow
            totalChi={fromTroyOz(holdings.totalTroyOz, "chi")}
            totalDamlung={fromTroyOz(holdings.totalTroyOz, "damlung")}
            averageCostPerChi={priceFromTroyOz(
              holdings.averageCostPerTroyOz,
              "chi"
            )}
            marketValueUsd={gainLoss.marketValueUsd}
            gainLossUsd={gainLoss.gainLossUsd}
            gainLossPercent={gainLoss.gainLossPercent}
          />
          <TransactionHistory
            transactions={transactions}
            currentPricePerTroyOz={price.pricePerTroyOz}
          />
        </>
      )}

      <PriceHistoryChart
        points={chartPoints}
        breakEvenPerDamlung={
          hasHoldings
            ? Number(priceFromTroyOz(holdings.averageCostPerTroyOz, "damlung"))
            : undefined
        }
      />
    </div>
  );
}
