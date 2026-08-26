"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { computeGainLoss } from "@/lib/calc/gainLoss";
import { computeHoldings } from "@/lib/calc/holdings";
import { fromTroyOz, priceFromTroyOz } from "@/lib/calc/units";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { EmptyState } from "./empty-state";
import { HeroPriceCard } from "./hero-price-card";
import { PriceHistoryChart } from "./price-history-chart";
import { StatRow } from "./stat-row";
import { TransactionHistory, type TransactionRow } from "./transaction-history";
import type { AddSettledResult, EditableTransaction } from "./transaction-dialog";

// Owns the optimistic transaction state (add + delete) that used to live
// inside TransactionHistory alone. Lifted up here so an optimistic change
// recomputes holdings/gain-loss/break-even client-side and the whole
// dashboard updates instantly, not just the transaction table row — the
// user-reported gap: adding a transaction updated the table but the stat
// row and hero card's numbers still waited on router.refresh().
export function DashboardContent({
  transactions,
  pricePerTroyOz,
  pricePerChi,
  pricePerDamlung,
  capturedAt,
  isStale,
  chartPoints,
}: {
  transactions: TransactionRow[];
  pricePerTroyOz: string;
  pricePerChi: string;
  pricePerDamlung: string;
  capturedAt: Date;
  isStale: boolean;
  chartPoints: ChartPoint[];
}) {
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [pendingAdds, setPendingAdds] = useState<EditableTransaction[]>([]);
  const awaitingAddRefresh = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const rows: TransactionRow[] = [
    ...pendingAdds,
    ...transactions.filter((row) => !removedIds.has(row.id)),
  ];

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeout);
  }, [error]);

  useEffect(() => {
    if (awaitingAddRefresh.current) {
      setPendingAdds([]);
      awaitingAddRefresh.current = false;
    }
  }, [transactions]);

  function handleOptimisticAdd(row: EditableTransaction) {
    setError(null);
    setPendingAdds((prev) => [row, ...prev]);
  }

  function handleAddSettled(tempId: string, result: AddSettledResult) {
    if (result.ok) {
      awaitingAddRefresh.current = true;
    } else {
      setPendingAdds((prev) => prev.filter((row) => row.id !== tempId));
      setError(result.message);
    }
  }

  async function handleDelete(row: TransactionRow) {
    setError(null);
    setRemovedIds((prev) => new Set(prev).add(row.id));

    let res: Response;
    try {
      res = await fetch(`/api/transactions/${row.id}`, { method: "DELETE" });
    } catch {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      setError("Couldn't reach the server — the transaction was not deleted.");
      return;
    }

    if (!res.ok) {
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
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
    <div className="flex flex-col gap-6.5">
      <HeroPriceCard
        pricePerTroyOz={pricePerTroyOz}
        pricePerChi={pricePerChi}
        pricePerDamlung={pricePerDamlung}
        capturedAt={capturedAt}
        isStale={isStale}
      />

      {rows.length === 0 ? (
        <EmptyState
          onOptimisticAdd={handleOptimisticAdd}
          onAddSettled={handleAddSettled}
        />
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
            rows={rows}
            currentPricePerTroyOz={pricePerTroyOz}
            error={error}
            onDelete={handleDelete}
            onOptimisticAdd={handleOptimisticAdd}
            onAddSettled={handleAddSettled}
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
