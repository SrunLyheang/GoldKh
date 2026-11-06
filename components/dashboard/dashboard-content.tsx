"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/ui/toast";
import { computePosition } from "@/lib/calc/position";
import { fromTroyOz, priceFromTroyOz, type GoldUnit } from "@/lib/calc/units";
import { usePrefs } from "@/lib/prefs/prefs-context";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { Plus } from "lucide-react";
import { t } from "@/lib/i18n/dictionary";
import { EmptyState } from "./empty-state";
import { HeroPriceCard } from "./hero-price-card";
import { PriceHistoryChart } from "./price-history-chart";
import { RealizedPanel } from "./realized-panel";
import { StatRow } from "./stat-row";
import { RecentEntries } from "./recent-entries";
import type { TransactionRow } from "./transaction-history";
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

    notify.success("Transaction deleted.");
    startSync(() => router.refresh());
  }

  // `rows` is newest-first for the history table; computePosition re-sorts
  // it oldest-first before replaying the ledger.
  const { holdings, gainLoss, realized, breakEvenPerDamlung } =
    useMemo(
      () => computePosition(rows, pricePerTroyOz),
      [rows, pricePerTroyOz]
    );

  const hasEntries = rows.length > 0;

  // The open notebook. Left page: today's price and what you hold, ruled
  // off as a sum. Right page: the latest entries. Below the spread, the
  // price over time drawn on its own page. On a phone the pages stack and
  // "Write an entry" sits in thumb reach above the tab bar.
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="dash-enter grid overflow-hidden rounded-xl rounded-tr-none shadow-(--shadow-page) md:grid-cols-[1.08fr_1fr] md:rounded-tl-xl max-md:rounded-tr-xl">
        <div
          className="page page-margin rounded-none px-5 pb-8 pt-5 [--margin-x:0.75rem] sm:px-10 sm:[--margin-x:1.75rem] md:pl-14 md:pr-10 md:pt-7 md:[--margin-x:2.25rem]"
        >
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
          {hasEntries && (
            <div className="mt-10">
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
              {realized.saleCount > 0 && (
                <RealizedPanel
                  realizedUsd={realized.realizedUsd}
                  realizedPercent={realized.realizedPercent}
                  saleCount={realized.saleCount}
                />
              )}
            </div>
          )}
        </div>

        {/* The spine: a soft fold between the pages, drawn as shade on
            the right page's edge rather than a line. */}
        <div className="page relative rounded-none px-5 pb-8 pt-5 sm:px-10 md:pt-7 md:shadow-[inset_14px_0_18px_-14px_rgb(0_0_0/0.35)] max-md:mt-0.5">
          {hasEntries ? (
            <RecentEntries
              rows={rows}
              currentPricePerTroyOz={pricePerTroyOz}
              syncing={isSyncing}
              onAddClick={() => setAddOpen(true)}
              onDelete={handleDelete}
              onEditSuccess={handleEditSuccess}
            />
          ) : (
            <EmptyState onAddClick={() => setAddOpen(true)} />
          )}
        </div>
      </div>

      <TransactionDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onOptimisticAdd={addOptimistic}
        onAddSettled={handleAddSettled}
        currentPricePerTroyOz={pricePerTroyOz}
        existingTransactions={rows}
      />

      <div className="dash-enter [--enter-delay:60ms]">
        <PriceHistoryChart
          points={chartPoints}
          marketOpen={marketOpen}
          breakEvenPerDamlung={breakEvenPerDamlung}
        />
      </div>

      {hasEntries && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4 md:hidden">
          <Button
            size="lg"
            onClick={() => setAddOpen(true)}
            className="press pointer-events-auto min-h-12 rounded-full px-6 shadow-(--shadow-float)"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t.transactions.addTransaction}
          </Button>
        </div>
      )}
    </div>
  );
}
