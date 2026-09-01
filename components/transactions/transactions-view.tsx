"use client";

import { ArrowDownLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { useSectionEnter } from "@/components/motion/use-section-enter";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { notify } from "@/lib/ui/toast";
import {
  filterTransactions,
  type FilterCriteria,
} from "@/lib/calc/filterTransactions";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { spotPerDamlungOnDate } from "@/lib/calc/priceHistory";
import type { GoldUnit } from "@/lib/calc/units";
import { useLocale } from "@/lib/i18n/locale-context";
import { CsvDialog } from "@/components/dashboard/csv-dialog";
import { MonoValue } from "@/components/dashboard/mono-value";
import { Panel } from "@/components/dashboard/panel";
import {
  AllRowsContext,
  RowActions,
  getRowDisplay,
  type TransactionRow,
} from "@/components/dashboard/transaction-history";
import { TransactionDetail } from "./transaction-detail";
import { BulkActionsBar } from "./bulk-actions-bar";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { RowCheckbox } from "./row-checkbox";
import { useRowSelection } from "./use-row-selection";
import {
  EMPTY_FILTERS,
  TransactionFilters,
  toCriteria,
  type FilterFormState,
} from "./transaction-filters";

type SortBy = "date" | "pnl";

function useSort() {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const onHeaderClick = (col: SortBy) => {
    if (col === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
  };
  return { sortBy, sortDir, onHeaderClick };
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
  className?: string;
}) {
  return (
    <th className={className}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "tt-label inline-flex items-center gap-1 text-[10.5px] font-medium transition-colors hover:text-foreground",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        {active && (
          <ChevronDown
            className={cn("h-3 w-3 transition-transform", dir === "asc" && "rotate-180")}
          />
        )}
      </button>
    </th>
  );
}

function ViewRow({
  row,
  currentPricePerTroyOz,
  displayUnit,
  priceHistory,
  selectMode,
  expanded,
  selected,
  onToggleSelect,
  onToggle,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  currentPricePerTroyOz: string;
  displayUnit: GoldUnit;
  priceHistory: ChartPoint[];
  selectMode: boolean;
  expanded: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onToggle: () => void;
  onDelete: (row: TransactionRow) => void;
  onEditSuccess: () => void;
}) {
  const { t } = useLocale();
  const d = getRowDisplay(row, currentPricePerTroyOz, displayUnit, t);

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className={cn(
          "cursor-pointer border-b border-(--glass-border-to) last:border-0 hover:bg-(--glow-color) focus:outline-none focus-visible:bg-(--glow-color)",
          d.isPending && "opacity-60",
          (expanded || selected) && "bg-(--glow-color)"
        )}
      >
        {selectMode && (
          <td className="py-3 pr-1 pl-4">
            {d.isPending ? null : (
              <RowCheckbox
                checked={selected}
                onCheckedChange={onToggleSelect}
                label={`Select ${row.type} ${row.quantity} ${row.unit}`}
              />
            )}
          </td>
        )}
        <td className="py-3 pr-3 pl-2">
          <div className="flex items-center gap-2">
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                expanded && "rotate-180"
              )}
            />
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                d.isBuy ? "bg-state-gain/15" : "bg-destructive/15"
              )}
            >
              {d.isBuy ? (
                <ArrowDownLeft className="h-3.5 w-3.5 text-state-gain" />
              ) : (
                <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
            <span className="font-mono text-[12px] tabular-nums text-muted-foreground">
              {row.transactionDate}
            </span>
          </div>
        </td>
        <td className="py-3 pr-3 text-[13.5px] font-medium text-foreground">
          {d.isBuy ? t.transactions.buy : t.transactions.sell}{" "}
          {formatQuantity(row.quantity)} {d.unitLabel}
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums text-foreground">
          {d.paidAmount}
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
          {formatUsd(d.pricePerDisplayUnit)}
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums text-foreground">
          {d.valuation.currentValueUsd ? (
            formatUsd(d.valuation.currentValueUsd)
          ) : (
            <span title={d.blankValueReason} className="cursor-help">
              —
            </span>
          )}
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums">
          {d.valuation.pnlUsd ? (
            <MonoValue signed tone={d.isGain ? "gain" : "loss"} className="text-[13px]">
              {formatUsd(d.valuation.pnlUsd)}
            </MonoValue>
          ) : (
            <span title={d.blankValueReason} className="cursor-help text-muted-foreground">
              —
            </span>
          )}
        </td>
        <td className="py-3 pr-4 pl-1 text-right" onClick={(e) => e.stopPropagation()}>
          {d.isPending ? (
            <span className="text-[11.5px] text-muted-foreground">{t.transactions.saving}</span>
          ) : (
            <RowActions
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              onDelete={onDelete}
              onEditSuccess={onEditSuccess}
            />
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-(--glass-border-to) last:border-0">
          <td colSpan={selectMode ? 8 : 7} className="p-0">
            <TransactionDetail
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              displayUnit={displayUnit}
              spotPerDamlungOnDate={spotPerDamlungOnDate(priceHistory, row.transactionDate)}
            />
          </td>
        </tr>
      )}
    </>
  );
}

function ViewCard({
  row,
  currentPricePerTroyOz,
  displayUnit,
  priceHistory,
  selectMode,
  expanded,
  selected,
  onToggleSelect,
  onToggle,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  currentPricePerTroyOz: string;
  displayUnit: GoldUnit;
  priceHistory: ChartPoint[];
  selectMode: boolean;
  expanded: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onToggle: () => void;
  onDelete: (row: TransactionRow) => void;
  onEditSuccess: () => void;
}) {
  const { t } = useLocale();
  const d = getRowDisplay(row, currentPricePerTroyOz, displayUnit, t);

  return (
    <Panel
      className={cn(
        "flex flex-col p-0",
        d.isPending && "opacity-60",
        selected && "ring-1 ring-primary/40"
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        className="flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 py-3.5 focus:outline-none focus-visible:bg-(--glow-color)"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {selectMode && !d.isPending && (
            <RowCheckbox
              checked={selected}
              onCheckedChange={onToggleSelect}
              label={`Select ${row.type} ${row.quantity} ${row.unit}`}
            />
          )}
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              d.isBuy ? "bg-state-gain/15" : "bg-destructive/15"
            )}
          >
            {d.isBuy ? (
              <ArrowDownLeft className="h-4 w-4 text-state-gain" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-foreground">
              {d.isBuy ? t.transactions.buy : t.transactions.sell}{" "}
              {formatQuantity(row.quantity)} {d.unitLabel}
            </p>
            <MonoValue tone="muted" className="text-[11.5px]">
              {row.transactionDate}
            </MonoValue>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {!d.isPending && (
            <RowActions
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              onDelete={onDelete}
              onEditSuccess={onEditSuccess}
            />
          )}
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-4 pb-4">
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">{t.transactions.paid}</p>
          <MonoValue className="mt-0.5 block text-[13.5px]">{d.paidAmount}</MonoValue>
        </div>
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">{t.transactions.pnl}</p>
          {d.valuation.pnlUsd ? (
            <MonoValue signed tone={d.isGain ? "gain" : "loss"} className="mt-0.5 block text-[13.5px]">
              {formatUsd(d.valuation.pnlUsd)}
            </MonoValue>
          ) : (
            <span className="text-[13.5px] text-muted-foreground">—</span>
          )}
        </div>
      </div>
      {expanded && (
        <TransactionDetail
          row={row}
          currentPricePerTroyOz={currentPricePerTroyOz}
          displayUnit={displayUnit}
          spotPerDamlungOnDate={spotPerDamlungOnDate(priceHistory, row.transactionDate)}
        />
      )}
    </Panel>
  );
}

// The full transactions route (dashboard-expansion-plan.md §4b): every
// row, a filter row, sortable Date / P&L, CSV import/export, and the same
// click-to-expand detail as the dashboard panel. Filter + sort state is
// component-local — not persisted, not in the URL for v1.
export function TransactionsView({
  transactions,
  currentPricePerTroyOz,
  priceHistory,
  displayUnit = "damlung",
}: {
  transactions: TransactionRow[];
  currentPricePerTroyOz: string;
  priceHistory: ChartPoint[];
  displayUnit?: GoldUnit;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const { ref: revealRef, revealClass, style: revealStyle } =
    useSectionEnter<HTMLDivElement>(0);
  const [, startSync] = useTransition();
  const [form, setForm] = useState<FilterFormState>(EMPTY_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPending, startBulk] = useTransition();
  // Selection is opt-in: the tick-boxes, select-all, and the bulk bar only
  // render once the user presses "Select". Leaving select mode clears any
  // ticks so a stale selection can't linger invisibly.
  const [selectMode, setSelectMode] = useState(false);
  const selection = useRowSelection();

  const enterSelectMode = () => {
    setExpandedId(null);
    setSelectMode(true);
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    selection.clear();
  };
  const { sortBy, sortDir, onHeaderClick } = useSort();

  const criteria: FilterCriteria = useMemo(
    () => ({ ...toCriteria(form), sortBy, sortDir }),
    [form, sortBy, sortDir]
  );
  const visible = useMemo(
    () => filterTransactions(transactions, criteria, currentPricePerTroyOz),
    [transactions, criteria, currentPricePerTroyOz]
  );
  // Optimistic (temp-) rows have no server id yet — keep them out of every
  // selection path so select-all and bulk delete never ship a "temp-…" id.
  const visibleIds = useMemo(
    () => visible.filter((r) => !r.id.startsWith("temp-")).map((r) => r.id),
    [visible],
  );
  // Filters can hide rows that are still in the selection set (toggleAll
  // only touches visible ids). Bulk delete and the selection bar operate
  // on the visible intersection only, so a hidden row is never reported
  // or deleted.
  const visibleSelectedIds = useMemo(() => {
    const seen = new Set(visibleIds);
    return selection.selectedArray.filter((id) => seen.has(id));
  }, [selection.selectedArray, visibleIds]);

  const refresh = () => startSync(() => router.refresh());

  function handleBulkDelete() {
    const ids = visibleSelectedIds;
    if (ids.length === 0) return;
    startBulk(async () => {
      let res: Response;
      try {
        res = await fetch("/api/transactions/bulk", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
      } catch {
        notify.error("Couldn't reach the server — nothing was deleted.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        notify.error(body?.error?.message ?? "Couldn't delete — please try again.");
        return;
      }
      const body = await res.json().catch(() => null);
      const deleted = body?.data?.deleted ?? ids.length;
      // Inline copy: locale is en-only and dictionary.ts is frozen this
      // phase (plan §11 Phase 0).
      notify.success(
        `${deleted} transaction${deleted === 1 ? "" : "s"} deleted.`
      );
      selection.clear();
      setBulkOpen(false);
      refresh();
    });
  }

  async function handleDelete(row: TransactionRow) {
    let res: Response;
    try {
      res = await fetch(`/api/transactions/${row.id}`, { method: "DELETE" });
    } catch {
      notify.error("Couldn't reach the server — the transaction was not deleted.");
      return;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      notify.error(body?.error?.message ?? "Couldn't delete — please try again.");
      return;
    }
    // No dictionary key for this exact toast; locale is en-only and
    // dictionary.ts is frozen this phase (plan §11 Phase 0).
    notify.success("Transaction deleted.");
    refresh();
  }

  const toggle = (id: string) =>
    setExpandedId((cur) => (cur === id ? null : id));

  return (
    <div
      ref={revealRef}
      style={revealStyle}
      className={cn("flex flex-col gap-5", revealClass)}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/dashboard"
          className="tt-label text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {t.chart.backToDashboard}
        </Link>
        <div className="flex items-center gap-2">
          {(visible.length > 0 || selectMode) && (
            // Inline copy: locale is en-only and dictionary.ts is frozen
            // this phase (plan §11 Phase 0). Kept mounted while select mode
            // is active so Cancel stays reachable even when a filter hides
            // every row.
            <button
              type="button"
              onClick={selectMode ? exitSelectMode : enterSelectMode}
              aria-pressed={selectMode}
              className={cn(
                "tt-label rounded-full border px-2.5 py-1.5 text-[10.5px] transition-colors",
                selectMode
                  ? "border-foreground bg-foreground text-background"
                  : "border-(--glass-border-to) text-muted-foreground hover:bg-(--glow-color) hover:text-foreground"
              )}
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setCsvOpen(true)}
            className="tt-label rounded-full border border-(--glass-border-to) px-2.5 py-1.5 text-[10.5px] text-muted-foreground transition-colors hover:bg-(--glow-color) hover:text-foreground"
          >
            {t.csv.importExport}
          </button>
        </div>
      </div>

      <h1 className="tt-heading tt-bracket text-[17px] text-foreground">
        {t.transactions.title}
      </h1>

      <Panel size="lg" className="flex flex-col gap-4">
        <TransactionFilters
          value={form}
          onChange={setForm}
          resultCount={visible.length}
        />

        {visible.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-muted-foreground">
            {t.filters.noResults}
          </p>
        ) : (
          <>
            <AllRowsContext.Provider value={transactions}>
              <div className="hidden overflow-x-auto rounded-lg border border-(--glass-border-to) md:block">
                <table className="w-full min-w-140 border-collapse">
                  <thead className="glass-chrome sticky top-0 z-10">
                    <tr className="border-b border-(--glass-border-to)">
                      {selectMode && (
                        <th className="py-3 pr-1 pl-4">
                          <RowCheckbox
                            checked={selection.allSelected(visibleIds)}
                            onCheckedChange={() =>
                              selection.toggleAll(visibleIds)
                            }
                            label="Select all transactions"
                          />
                        </th>
                      )}
                      <SortHeader
                        className="py-3 pr-3 pl-2 text-left"
                        label={t.filters.sortDate}
                        active={sortBy === "date"}
                        dir={sortDir}
                        onClick={() => onHeaderClick("date")}
                      />
                      <th className="py-3 pr-3 text-left tt-label text-[10.5px] font-medium text-muted-foreground">
                        {t.transactions.quantity}
                      </th>
                      <th className="py-3 pr-3 text-right tt-label text-[10.5px] font-medium text-muted-foreground">
                        {t.transactions.paid}
                      </th>
                      <th className="py-3 pr-3 text-right tt-label text-[10.5px] font-medium text-muted-foreground">
                        /{displayUnit}
                      </th>
                      <th className="py-3 pr-3 text-right tt-label text-[10.5px] font-medium text-muted-foreground">
                        {t.transactions.currentValue}
                      </th>
                      <SortHeader
                        className="py-3 pr-3 text-right"
                        label={t.filters.sortPnl}
                        active={sortBy === "pnl"}
                        dir={sortDir}
                        onClick={() => onHeaderClick("pnl")}
                      />
                      <th className="py-3 pr-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <ViewRow
                        key={row.id}
                        row={row}
                        currentPricePerTroyOz={currentPricePerTroyOz}
                        displayUnit={displayUnit}
                        priceHistory={priceHistory}
                        selectMode={selectMode}
                        expanded={expandedId === row.id}
                        selected={selection.selectedIds.has(row.id)}
                        onToggleSelect={() => selection.toggle(row.id)}
                        onToggle={() => toggle(row.id)}
                        onDelete={handleDelete}
                        onEditSuccess={refresh}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 md:hidden">
                {visible.map((row) => (
                  <ViewCard
                    key={row.id}
                    row={row}
                    currentPricePerTroyOz={currentPricePerTroyOz}
                    displayUnit={displayUnit}
                    priceHistory={priceHistory}
                    selectMode={selectMode}
                    expanded={expandedId === row.id}
                    selected={selection.selectedIds.has(row.id)}
                    onToggleSelect={() => selection.toggle(row.id)}
                    onToggle={() => toggle(row.id)}
                    onDelete={handleDelete}
                    onEditSuccess={refresh}
                  />
                ))}
              </div>
            </AllRowsContext.Provider>
          </>
        )}
      </Panel>

      {visibleSelectedIds.length > 0 && (
        <div className="sticky bottom-4 z-20">
          <BulkActionsBar
            count={visibleSelectedIds.length}
            onClear={selection.clear}
            onDelete={() => setBulkOpen(true)}
            className="shadow-lg"
          />
        </div>
      )}

      <BulkDeleteDialog
        open={bulkOpen}
        onOpenChange={(open) => !bulkPending && setBulkOpen(open)}
        count={visibleSelectedIds.length}
        pending={bulkPending}
        onConfirm={handleBulkDelete}
      />

      <CsvDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        rows={transactions}
        onImported={refresh}
      />
    </div>
  );
}
