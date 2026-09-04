import { auth } from "@clerk/nextjs/server";
import { buildDamlungPriceSeries } from "@/lib/calc/priceHistory";
import { listTransactionsForUser } from "@/lib/db/queries/transactions";
import { listRecentPriceSnapshots } from "@/lib/db/queries/priceSnapshots";
import { getPrice } from "@/lib/price/getPrice";
import { TransactionsView } from "@/components/transactions/transactions-view";

// The full transactions route. Loads the
// same two reads the dashboard does — the user's ledger and the recent
// price snapshots — plus the current price; all filtering, sorting, and
// CSV import/export happen client-side in TransactionsView.
export default async function TransactionsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const [price, transactions] = await Promise.all([
    getPrice(),
    listTransactionsForUser(userId),
  ]);
  const recentSnapshots = await listRecentPriceSnapshots();

  return (
    <TransactionsView
      transactions={transactions}
      currentPricePerTroyOz={price.pricePerTroyOz}
      priceHistory={buildDamlungPriceSeries(recentSnapshots)}
    />
  );
}
