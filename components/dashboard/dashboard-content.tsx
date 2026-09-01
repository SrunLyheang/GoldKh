"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useReveal } from "@/components/motion/use-reveal";
import { notify } from "@/lib/ui/toast";
import { computeGainLoss } from "@/lib/calc/gainLoss";
import { computeHoldings } from "@/lib/calc/holdings";
import { computeRealized } from "@/lib/calc/realized";
import { toChronological } from "@/lib/calc/chronological";
import { fromTroyOz, priceFromTroyOz, type GoldUnit } from "@/lib/calc/units";
import { usePrefs } from "@/lib/prefs/prefs-context";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { EmptyState } from "./empty-state";
import { HeroPriceCard } from "./hero-price-card";
import { PriceHistoryChart } from "./price-history-chart";
import { RealizedPanel } from "./realized-panel";
import { StatRow } from "./stat-row";
import { TransactionHistory, type TransactionRow } from "./transaction-history";
import { TransactionDialog, type AddSettledResult } from "./transaction-dialog";
import { useOptimisticTransactions } from "./use-optimistic-transactions";

// Owns the merged transaction list (via useOptimisticTransactions), so an
// optimistic change recomputes holdings/gain-loss/break-even client-side
// and the whole dashboard updates instantly, not just the transaction
// table row — the user-reported gap: adding a transaction updated the
// table but the stat row and hero card's numbers still waited on
// router.refresh(). That reconciling refresh runs inside a useTransition
// so it never blanks the page. Every add/edit/delete outcome — success
// and failure alike — is reported through the shared Sonner toast; there
// is no second in-page banner.
export function DashboardContent({
  transactions,
  pricePerTroyOz,
  pricePerChi,
  pricePerDamlung,
  capturedAt,
  isStale,
  chartPoints,
  refreshCooldownEndsAt,
  marketOpen = true,
}: {
  transactions: TransactionRow[];
  pricePerTroyOz: string;
  pricePerChi: string;
  pricePerDamlung: string;
  capturedAt: Date;
  isStale: boolean;
  chartPoints: ChartPoint[];
  refreshCooldownEndsAt: number | null;
  marketOpen?: boolean;
}) {
  const router = useRouter();
  const { prefs } = usePrefs();
  const [addOpen, setAddOpen] = useState(false);
  const [displayUnit, setDisplayUnit] = useState<GoldUnit>(prefs.displayUnit);
  const [isSyncing, startSync] = useTransition();

  // Sections glide in on scroll-into-view, staggered. Hooks are called
  // unconditionally; the wrappers below attach ref + class + delay.
  const { ref: heroRef, revealClass: heroCls, style: heroStyle } =
    useReveal<HTMLDivElement>(0);
  const { ref: statRef, revealClass: statCls, style: statStyle } =
    useReveal<HTMLDivElement>(80);
  const { ref: realizedRef, revealClass: realizedCls, style: realizedStyle } =
    useReveal<HTMLDivElement>(140);
  const { ref: historyRef, revealClass: historyCls, style: historyStyle } =
    useReveal<HTMLDivElement>(180);
  const { ref: chartRef, revealClass: chartCls, style: chartStyle } =
    useReveal<HTMLDivElement>(200);
  const { rows, addOptimistic, settleAdd, markRemoved, unmarkRemoved } =
    useOptimisticTransactions(transactions);

  function handleAddSettled(tempId: string, result: AddSettledResult) {
    settleAdd(tempId, result);
    if (result.ok) {
      startSync(() => router.refresh());
    }
    // A failed add rolls its optimistic row back (settleAdd) and is
    // reported by the dialog's own toast — nothing to do here.
  }

  function handleEditSuccess() {
    startSync(() => router.refresh());
  }

  async function handleDelete(row: TransactionRow) {
    markRemoved(row.id);

    let res: Response;
    try {
      res = await fetch(`/api/transactions/${row.id}`, { method: "DELETE" });
    } catch {
      unmarkRemoved(row.id);
      notify.error("Couldn't reach the server — the transaction was not deleted.");
      return;
    }

    if (!res.ok) {
      unmarkRemoved(row.id);
      const body = await res.json().catch(() => null);
      notify.error(body?.error?.message ?? "Couldn't delete — please try again.");
      return;
    }

    startSync(() => router.refresh());
  }

  // Multi-select delete from the Transaction History panel. Optimistically
  // hides every selected row, fires one bulk request, and rolls the whole
  // batch back on failure. Returns success so the panel can clear its
  // selection and close the confirm dialog.
  async function handleBulkDelete(ids: string[]): Promise<boolean> {
    ids.forEach(markRemoved);

    let res: Response;
    try {
      res = await fetch("/api/transactions/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
    } catch {
      ids.forEach(unmarkRemoved);
      notify.error("Couldn't reach the server — nothing was deleted.");
      return false;
    }

    if (!res.ok) {
      ids.forEach(unmarkRemoved);
      const body = await res.json().catch(() => null);
      notify.error(body?.error?.message ?? "Couldn't delete — please try again.");
      return false;
    }

    const body = await res.json().catch(() => null);
    const deleted = body?.data?.deleted ?? ids.length;
    notify.success(
      `${deleted} transaction${deleted === 1 ? "" : "s"} deleted.`
    );
    startSync(() => router.refresh());
    return true;
  }

  // computeHoldings and computeRealized replay the ledger forward in
  // time; `rows` is newest-first for the history table, so they must be
  // re-sorted oldest-first or a sell is valued against an empty position.
  const chronological = toChronological(rows);
  const holdings = computeHoldings(chronological);
  const gainLoss = computeGainLoss(
    holdings.totalTroyOz,
    holdings.averageCostPerTroyOz,
    pricePerTroyOz
  );
  const realized = computeRealized(chronological);
  const hasHoldings = Number(holdings.totalTroyOz) > 0;

  return (
    <div className="flex flex-col gap-7 md:gap-9">
      <div ref={heroRef} className={heroCls} style={heroStyle}>
        <HeroPriceCard
          pricePerTroyOz={pricePerTroyOz}
          pricePerChi={pricePerChi}
          pricePerDamlung={pricePerDamlung}
          capturedAt={capturedAt}
          isStale={isStale}
          refreshCooldownEndsAt={refreshCooldownEndsAt}
          marketOpen={marketOpen}
          displayUnit={displayUnit}
          onDisplayUnitChange={setDisplayUnit}
        />
      </div>

      <TransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onOptimisticAdd={addOptimistic}
        onAddSettled={handleAddSettled}
        currentPricePerTroyOz={pricePerTroyOz}
        existingTransactions={rows}
      />

      {rows.length === 0 ? (
        <EmptyState onAddClick={() => setAddOpen(true)} />
      ) : (
        <>
          <div ref={statRef} className={statCls} style={statStyle}>
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
          {realized.saleCount > 0 && (
            <div ref={realizedRef} className={realizedCls} style={realizedStyle}>
              <RealizedPanel
                realizedUsd={realized.realizedUsd}
                realizedPercent={realized.realizedPercent}
                saleCount={realized.saleCount}
              />
            </div>
          )}
          <div ref={historyRef} className={historyCls} style={historyStyle}>
            <TransactionHistory
              rows={rows}
              currentPricePerTroyOz={pricePerTroyOz}
              priceHistory={chartPoints}
              syncing={isSyncing}
              displayUnit={displayUnit}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              onAddClick={() => setAddOpen(true)}
              onEditSuccess={handleEditSuccess}
              onCsvImported={() => startSync(() => router.refresh())}
            />
          </div>
        </>
      )}

      <div ref={chartRef} className={chartCls} style={chartStyle}>
        <PriceHistoryChart
          points={chartPoints}
          marketOpen={marketOpen}
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
