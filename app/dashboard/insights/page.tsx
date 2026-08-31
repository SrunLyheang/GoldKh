import { auth } from "@clerk/nextjs/server";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { listRecentPriceSnapshots } from "@/lib/db/queries/priceSnapshots";
import { getPrice } from "@/lib/price/getPrice";
import { InsightsContent } from "@/components/insights/insights-content";

// "Is my position any good?" — headline readouts, portfolio value over
// time (the shared DetailedChart inline), per-buy quality, and a what-if
// calculator (dashboard-expansion-plan.md §5). Loads the same two queries
// the dashboard uses plus the current price; everything shown is derived
// at read time from the ledger and stored price snapshots — no new table,
// no cron (§8).
export default async function InsightsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  // getPrice() can append a fresh snapshot as a side effect, so
  // listRecentPriceSnapshots() must run after it — same ordering the
  // dashboard page documents.
  const [price, transactions] = await Promise.all([
    getPrice(),
    listTransactionsForUser(userId),
  ]);
  const snapshots = await listRecentPriceSnapshots();

  return (
    <InsightsContent
      transactions={transactions.map((tx) => ({
        type: tx.type,
        quantity: tx.quantity,
        unit: tx.unit,
        pricePerUnit: tx.pricePerUnit,
        currency: tx.currency,
        transactionDate: tx.transactionDate,
      }))}
      snapshots={snapshots.map((snap) => ({
        t: snap.capturedAt.getTime(),
        pricePerTroyOz: snap.pricePerTroyOz,
      }))}
      pricePerTroyOz={price.pricePerTroyOz}
    />
  );
}
