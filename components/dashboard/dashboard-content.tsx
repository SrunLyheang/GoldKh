"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { computeGainLoss } from "@/lib/calc/gainLoss";
import { computeHoldings } from "@/lib/calc/holdings";
import { fromTroyOz, priceFromTroyOz, type GoldUnit } from "@/lib/calc/units";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { EmptyState } from "./empty-state";
import { HeroPriceCard } from "./hero-price-card";
import { PriceHistoryChart } from "./price-history-chart";
import { StatRow } from "./stat-row";
import { TransactionHistory, type TransactionRow } from "./transaction-history";
import { TransactionDialog, type AddSettledResult } from "./transaction-dialog";
import { useOptimisticTransactions } from "./use-optimistic-transactions";

// Owns the merged transaction list (via useOptimisticTransactions) and the
// error/success banner state around it, so an optimistic change recomputes
// holdings/gain-loss/break-even client-side and the whole dashboard updates
// instantly, not just the transaction table row — the user-reported gap:
// adding a transaction updated the table but the stat row and hero card's
// numbers still waited on router.refresh().
export function DashboardContent({
  transactions,
  pricePerTroyOz,
  pricePerChi,
  pricePerDamlung,
  capturedAt,
  isStale,
  chartPoints,
  refreshCooldownEndsAt,
}: {
  transactions: TransactionRow[];
  pricePerTroyOz: string;
  pricePerChi: string;
  pricePerDamlung: string;
  capturedAt: Date;
  isStale: boolean;
  chartPoints: ChartPoint[];
  refreshCooldownEndsAt: number | null;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<GoldUnit>("damlung");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { rows, addOptimistic, settleAdd, markRemoved, unmarkRemoved } =
    useOptimisticTransactions(transactions);

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => setSuccessMessage(null), 5000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  function handleOptimisticAdd(row: Parameters<typeof addOptimistic>[0]) {
    setError(null);
    addOptimistic(row);
  }

  function handleAddSettled(tempId: string, result: AddSettledResult) {
    settleAdd(tempId, result);
    if (result.ok) {
      setSuccessMessage("Transaction added");
    } else {
      setError(result.message);
    }
  }

  function handleEditSuccess() {
    setSuccessMessage("Transaction updated");
  }

  async function handleDelete(row: TransactionRow) {
    setError(null);
    markRemoved(row.id);

    let res: Response;
    try {
      res = await fetch(`/api/transactions/${row.id}`, { method: "DELETE" });
    } catch {
      unmarkRemoved(row.id);
      setError("Couldn't reach the server — the transaction was not deleted.");
      return;
    }

    if (!res.ok) {
      unmarkRemoved(row.id);
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Couldn't delete — please try again.");
      return;
    }

    router.refresh();
  }

  const holdings = computeHoldings(rows);
  const gainLoss = computeGainLoss(
    holdings.totalTroyOz,
    holdings.averageCostPerTroyOz,
    pricePerTroyOz
  );
  const hasHoldings = Number(holdings.totalTroyOz) > 0;

  return (
    <div className="flex flex-col gap-7 md:gap-9">
      <div className="vault-enter">
        <HeroPriceCard
          pricePerTroyOz={pricePerTroyOz}
          pricePerChi={pricePerChi}
          pricePerDamlung={pricePerDamlung}
          capturedAt={capturedAt}
          isStale={isStale}
          refreshCooldownEndsAt={refreshCooldownEndsAt}
          displayUnit={displayUnit}
          onDisplayUnitChange={setDisplayUnit}
        />
      </div>

      <TransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onOptimisticAdd={handleOptimisticAdd}
        onAddSettled={handleAddSettled}
        currentPricePerTroyOz={pricePerTroyOz}
        existingTransactions={rows}
      />

      {rows.length === 0 ? (
        <EmptyState onAddClick={() => setAddOpen(true)} />
      ) : (
        <>
          <div className="vault-enter" style={{ "--enter-delay": "80ms" } as CSSProperties}>
            <StatRow
              totalChi={fromTroyOz(holdings.totalTroyOz, "chi")}
              totalDamlung={fromTroyOz(holdings.totalTroyOz, "damlung")}
              averageCostPerChi={priceFromTroyOz(
                holdings.averageCostPerTroyOz,
                "chi"
              )}
              averageCostPerDamlung={priceFromTroyOz(
                holdings.averageCostPerTroyOz,
                "damlung"
              )}
              marketValueUsd={gainLoss.marketValueUsd}
              gainLossUsd={gainLoss.gainLossUsd}
              gainLossPercent={gainLoss.gainLossPercent}
              displayUnit={displayUnit}
            />
          </div>
          <div className="vault-enter" style={{ "--enter-delay": "140ms" } as CSSProperties}>
            <TransactionHistory
              rows={rows}
              currentPricePerTroyOz={pricePerTroyOz}
              error={error}
              successMessage={successMessage}
              displayUnit={displayUnit}
              onDelete={handleDelete}
              onAddClick={() => setAddOpen(true)}
              onEditSuccess={handleEditSuccess}
            />
          </div>
        </>
      )}

      <div className="vault-enter" style={{ "--enter-delay": "200ms" } as CSSProperties}>
        <PriceHistoryChart
          points={chartPoints}
          breakEvenPerDamlung={
            hasHoldings
              ? Number(priceFromTroyOz(holdings.averageCostPerTroyOz, "damlung"))
              : undefined
          }
        />
      </div>
    </div>
  );
}
