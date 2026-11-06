"use client";

import { ArrowDownLeft, ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { formatEntryDate } from "@/lib/format/datetime";
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
import { t } from "@/lib/i18n/dictionary";
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
          "tt-label inline-flex items-center gap-1 text-label font-medium transition-colors hover:text-foreground",
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
  const d = getRowDisplay(row, currentPricePerTroyOz, displayUnit);

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
          "cursor-pointer border-b border-(--glass-border-to) last:border-0 transition-colors duration-(--dur-micro) hover:bg-(--glow-color) focus:outline-none focus-visible:bg-(--glow-color)",
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
            <span className="text-detail tabular-nums text-muted-foreground" title={row.transactionDate}>
              {formatEntryDate(row.transactionDate)}
            </span>
          </div>
        </td>
        <td className="py-3 pr-3 text-body text-foreground">
          <span className={cn("mr-1.5", !d.isBuy && "text-muted-foreground")}>
            {d.isBuy ? t.recent.bought : t.recent.sold}
          </span>
          <span className="font-medium tabular-nums">
            {formatQuantity(row.quantity)} {d.unitLabel}
          </span>
          {row.notes && (
            <span className="hand ml-2 text-detail" title={row.notes}>
              {row.notes.length > 42 ? `${row.notes.slice(0, 40)}…` : row.notes}
            </span>
          )}
        </td>
        <td className="py-3 pr-3 text-right text-detail tabular-nums text-foreground">
          {d.paidAmount}
        </td>
        <td className="py-3 pr-3 text-right text-detail tabular-nums text-muted-foreground">
          {d.perUnitLabel}
        </td>
        <td className="py-3 pr-3 text-right text-detail tabular-nums text-foreground">
          {d.valuation.currentValueUsd ? (
            formatUsd(d.valuation.currentValueUsd)
          ) : (
            <span title={d.blankValueReason} className="cursor-help">
              —
            </span>
          )}
        </td>
        <td className="py-3 pr-3 text-right text-detail tabular-nums">
          {d.valuation.pnlUsd ? (
            <MonoValue signed tone={d.isGain ? "gain" : "loss"} className="text-detail">
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
            <span className="text-label text-muted-foreground">{t.transactions.saving}</span>
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
  const d = getRowDisplay(row, currentPricePerTroyOz, displayUnit);

  return (
    <div
      className={cn(
        "flex flex-col border-b border-(--glass-border-to) last:border-0",
        d.isPending && "opacity-60",
        selected && "bg-(--glow-color)"
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
        className="flex min-h-14 cursor-pointer items-center justify-between gap-2 px-1 py-2.5 focus:outline-none focus-visible:bg-(--glow-color)"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {selectMode && !d.isPending && (
            <RowCheckbox
              checked={selected}
              onCheckedChange={onToggleSelect}
              label={`Select ${row.type} ${row.quantity} ${row.unit}`}
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-body text-foreground">
              <span className={cn(!d.isBuy && "text-muted-foreground")}>
                {d.isBuy ? t.recent.bought : t.recent.sold}
              </span>{" "}
              <span className="font-medium tabular-nums">
                {formatQuantity(row.quantity)} {d.unitLabel}
              </span>
            </p>
            <p className="truncate text-label text-faint tabular-nums">
              {formatEntryDate(row.transactionDate)} · {d.paidAmount}
              {row.notes && <span className="hand ml-1.5 text-label"> {row.notes}</span>}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {d.valuation.pnlUsd ? (
            <MonoValue signed tone={d.isGain ? "gain" : "loss"} className="text-detail font-medium">
              {formatUsd(d.valuation.pnlUsd)}
            </MonoValue>
          ) : (
            <span className="text-label text-faint" title={d.blankValueReason}>
              {row.currency !== "USD" ? t.recent.inRiel : t.recent.soldNote}
            </span>
          )}
          {!d.isPending && (
            <RowActions
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              onDelete={onDelete}
              onEditSuccess={onEditSuccess}
            />
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
    </div>
  );
}

// The full transactions route: every row, a filter row, sortable
// Date / P&L, CSV import/export, and the same
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

  const actions = (
    <div className="flex items-center gap-1">
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
                "press inline-flex min-h-10 items-center rounded-md px-3.5 text-detail font-medium",
                selectMode
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-(--glow-color) hover:text-foreground"
              )}
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setCsvOpen(true)}
            className="press inline-flex min-h-10 items-center rounded-md px-3.5 text-detail font-medium text-gold hover:bg-(--glow-color)"
          >
            {t.csv.importExport}
          </button>
        </div>
  );

  return (
    <div
      ref={revealRef}
      style={revealStyle}
      className={cn("flex flex-col gap-5", revealClass)}
    >
      <Panel size="lg" className="page--plain flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="tt-heading text-figure-lg text-foreground">
              {t.transactions.title}
            </h1>
            <p className="mt-1 text-detail text-muted-foreground">
              {t.recent.subtitle(transactions.length)}
            </p>
          </div>
          {actions}
        </div>
        <TransactionFilters
          value={form}
          onChange={setForm}
          resultCount={visible.length}
        />

        {visible.length === 0 ? (
          <p className="py-8 text-center text-detail text-muted-foreground">
            {t.filters.noResults}
          </p>
        ) : (
          <>
            <AllRowsContext.Provider value={transactions}>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-140 border-collapse">
                  <thead className="sticky top-0 z-10 bg-page">
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
                      <th className="py-3 pr-3 text-left text-label font-medium text-faint">
                        {t.transactions.quantity}
                      </th>
                      <th className="py-3 pr-3 text-right text-label font-medium text-faint">
                        {t.transactions.paid}
                      </th>
                      <th className="py-3 pr-3 text-right text-label font-medium text-faint">
                        /{displayUnit}
                      </th>
                      <th className="py-3 pr-3 text-right text-label font-medium text-faint">
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
              <div className="-mx-1 flex flex-col md:hidden">
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
            className="shadow-(--shadow-float)"
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
