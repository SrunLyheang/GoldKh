"use client";

import Decimal from "decimal.js";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  MoreVertical,
  Pencil,
  Plus,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { computeRowValuation } from "@/lib/calc/transactionRow";
import type { LedgerEntry } from "@/lib/calc/ledgerEntry";
import type { ChartPoint } from "@/lib/calc/priceHistory";
import { spotPerDamlungOnDate } from "@/lib/calc/priceHistory";
import { priceFromTroyOz, type GoldUnit } from "@/lib/calc/units";
import { classifyPrice, isHardVerdict } from "@/lib/validation/priceSanity";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { TransactionDetail } from "@/components/transactions/transaction-detail";
import { BulkActionsBar } from "@/components/transactions/bulk-actions-bar";
import { BulkDeleteDialog } from "@/components/transactions/bulk-delete-dialog";
import { RowCheckbox } from "@/components/transactions/row-checkbox";
import { useRowSelection } from "@/components/transactions/use-row-selection";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/magnetic";
import { CsvDialog } from "./csv-dialog";
import { MonoValue } from "./mono-value";
import { Panel } from "./panel";
import { TransactionDialog } from "./transaction-dialog";

export interface TransactionRow extends LedgerEntry {
  id: string;
  transactionDate: string;
  notes?: string | null;
}

// Shared between the desktop table's Row and the mobile card list's
// TransactionCard so the two views can't drift on how a figure is
// derived or blanked out. Exported so the full transactions route
// (components/transactions/transactions-view.tsx) derives its rows the
// same way.
export function getRowDisplay(
  row: TransactionRow,
  currentPricePerTroyOz: string,
  displayUnit: GoldUnit,
  t: Dictionary,
) {
  const isBuy = row.type === "buy";
  const isPending = row.id.startsWith("temp-");
  const valuation = computeRowValuation(row, currentPricePerTroyOz);
  const pricePerDisplayUnit =
    displayUnit === "chi" ? valuation.pricePerChi : valuation.pricePerDamlung;
  const isGain = valuation.pnlUsd !== null && Number(valuation.pnlUsd) >= 0;
  // Flag a USD row whose per-unit price is more than 10× off the current
  // spot rate (same hard band as the Add dialog's Phase 2 guard) — most
  // likely a pre-fix row where the total was typed into the per-unit
  // field. The ratio is unit-independent, so comparing in the display
  // unit is fine. Not auto-corrected — the user edits it.
  const priceLooksOffSpot =
    row.currency === "USD" &&
    isHardVerdict(
      classifyPrice(
        Number(pricePerDisplayUnit),
        Number(priceFromTroyOz(currentPricePerTroyOz, displayUnit)),
      ),
    );
  // Both cells fall back to "—" for two different reasons that used to
  // look identical: KHR conversion is deferred entirely (project-
  // overview.md), and a sell row simply has no ongoing position to
  // value. The title distinguishes them without a new Tooltip component.
  const blankValueReason =
    row.currency !== "USD"
      ? t.transactions.khrNote
      : row.type === "sell"
        ? t.transactions.sellNote
        : undefined;
  const paidAmount =
    row.currency === "USD"
      ? formatUsd(valuation.amountUsd ?? "0")
      : `${new Intl.NumberFormat("en-US").format(
          Number(new Decimal(row.quantity).times(row.pricePerUnit)),
        )} KHR`;
  // Lowercase to match the existing "10 chi"/"3 damlung" convention
  // this table already used before i18n (row.unit was rendered raw).
  const unitLabel = unitLabels(t, row.unit).primaryLower;

  return {
    isBuy,
    isPending,
    valuation,
    pricePerDisplayUnit,
    isGain,
    priceLooksOffSpot,
    blankValueReason,
    paidAmount,
    unitLabel,
  };
}

// Only RowActions needs the full row list (to compute holdings excluding
// the row being edited, in TransactionDialog). Row and TransactionCard sit
// between it and TransactionHistory but have no use for it themselves —
// context lets RowActions read it directly instead of both intermediates
// carrying a prop they never touch. Exported so the full transactions
// route can reuse the same edit/delete affordance (§4b "same row
// behaviour").
export const AllRowsContext = createContext<TransactionRow[]>([]);

export function RowActions({
  row,
  currentPricePerTroyOz,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  currentPricePerTroyOz: string;
  onDelete: (row: TransactionRow) => void;
  onEditSuccess: () => void;
}) {
  const allRows = useContext(AllRowsContext);
  const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="tt-label border border-destructive px-2 py-1 text-[10.5px] text-destructive hover:bg-destructive/10"
        >
          {t.transactions.delete}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="tt-label border border-border px-2 py-1 text-[10.5px] text-muted-foreground hover:bg-accent"
        >
          {t.transactions.cancel}
        </button>
      </div>
    );
  }

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={t.transactions.actionsFor(
                row.type === "buy" ? t.transactions.buy : t.transactions.sell,
                row.quantity,
                unitLabels(t, row.unit).primary,
              )}
              className="shrink-0 rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            {t.transactions.edit}
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 />
            {t.transactions.delete}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <TransactionDialog
        transaction={row}
        open={editOpen}
        onOpenChange={setEditOpen}
        onEditSuccess={onEditSuccess}
        currentPricePerTroyOz={currentPricePerTroyOz}
        existingTransactions={allRows}
      />
    </>
  );
}

// Enter / Space toggle a row's expander, matching a <button>. Space is
// prevented from scrolling the page.
function expandKeyHandler(toggle: () => void) {
  return (e: KeyboardEvent) => {
    // Ignore keys aimed at nested controls (checkbox, actions menu).
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };
}

function Row({
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
  const {
    isBuy,
    isPending,
    valuation,
    pricePerDisplayUnit,
    isGain,
    priceLooksOffSpot,
    blankValueReason,
    paidAmount,
    unitLabel,
  } = getRowDisplay(row, currentPricePerTroyOz, displayUnit, t);

  return (
    <>
      <tr
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={expandKeyHandler(onToggle)}
        className={cn(
          "cursor-pointer border-b border-border last:border-0 focus:outline-none focus-visible:bg-accent/50 hover:bg-accent/40",
          isPending && "opacity-60",
          (expanded || selected) && "bg-accent/40",
        )}
      >
        {selectMode && (
          <td className="py-3 pr-1 pl-4">
            {isPending ? null : (
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
                expanded && "rotate-180",
              )}
            />
            <div
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
                isBuy ? "bg-state-gain/15" : "bg-destructive/15",
              )}
            >
              {isBuy ? (
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
          {isBuy ? t.transactions.buy : t.transactions.sell}{" "}
          {formatQuantity(row.quantity)} {unitLabel}
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums text-foreground">
          {paidAmount}
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
          <span className="inline-flex items-center justify-end gap-1">
            {priceLooksOffSpot && (
              <span title={t.transactions.priceOffSpot} className="cursor-help">
                <TriangleAlert
                  className="h-3 w-3 text-destructive"
                  aria-label={t.transactions.priceOffSpot}
                />
              </span>
            )}
            {formatUsd(pricePerDisplayUnit)}
          </span>
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums text-foreground">
          {valuation.currentValueUsd ? (
            formatUsd(valuation.currentValueUsd)
          ) : (
            <span title={blankValueReason} className="cursor-help">
              —
            </span>
          )}
        </td>
        <td className="py-3 pr-3 text-right font-mono text-[13px] tabular-nums">
          {valuation.pnlUsd ? (
            <MonoValue
              signed
              tone={isGain ? "gain" : "loss"}
              className="text-[13px]"
            >
              {formatUsd(valuation.pnlUsd)}
            </MonoValue>
          ) : (
            <span
              title={blankValueReason}
              className="cursor-help text-muted-foreground"
            >
              —
            </span>
          )}
        </td>
        <td
          className="py-3 pl-1 text-right"
          onClick={(e) => e.stopPropagation()}
        >
          {isPending ? (
            <span className="text-[11.5px] text-muted-foreground">
              {t.transactions.saving}
            </span>
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
        <tr className="border-b border-border last:border-0">
          <td colSpan={selectMode ? 8 : 7} className="p-0">
            <TransactionDetail
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              displayUnit={displayUnit}
              spotPerDamlungOnDate={spotPerDamlungOnDate(
                priceHistory,
                row.transactionDate,
              )}
            />
          </td>
        </tr>
      )}
    </>
  );
}

// Same data as Row, laid out as a card instead of a table row — the
// mobile substitute for the table, which would otherwise force
// sideways scrolling on phone widths.
function TransactionCard({
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
  const {
    isBuy,
    isPending,
    valuation,
    pricePerDisplayUnit,
    isGain,
    priceLooksOffSpot,
    blankValueReason,
    paidAmount,
    unitLabel,
  } = getRowDisplay(row, currentPricePerTroyOz, displayUnit, t);

  return (
    <Panel
      className={cn(
        "flex flex-col gap-3.5 p-0",
        isPending && "opacity-60",
        selected && "ring-1 ring-primary/40",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={expandKeyHandler(onToggle)}
        className={cn(
          "flex min-h-11 cursor-pointer items-center justify-between gap-2 px-4 pt-4 focus:outline-none focus-visible:bg-accent/40",
          expanded && "bg-accent/30",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {selectMode && !isPending && (
            <RowCheckbox
              checked={selected}
              onCheckedChange={onToggleSelect}
              label={`Select ${row.type} ${row.quantity} ${row.unit}`}
            />
          )}
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              isBuy ? "bg-state-gain/15" : "bg-destructive/15",
            )}
          >
            {isBuy ? (
              <ArrowDownLeft className="h-4 w-4 text-state-gain" />
            ) : (
              <ArrowUpRight className="h-4 w-4 text-destructive" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-medium text-foreground">
              {isBuy ? t.transactions.buy : t.transactions.sell}{" "}
              {formatQuantity(row.quantity)} {unitLabel}
            </p>
            <MonoValue tone="muted" className="text-[11.5px]">
              {row.transactionDate}
            </MonoValue>
          </div>
        </div>
        <div
          className="flex shrink-0 items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {isPending ? (
            <span className="text-[11.5px] text-muted-foreground">
              {t.transactions.saving}
            </span>
          ) : (
            <RowActions
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              onDelete={onDelete}
              onEditSuccess={onEditSuccess}
            />
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              expanded && "rotate-180",
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 px-4 pb-4">
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">
            {t.transactions.paid}
          </p>
          <MonoValue className="mt-0.5 block text-[13.5px]">
            {paidAmount}
          </MonoValue>
        </div>
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">
            /{unitLabels(t, displayUnit).primaryLower}
          </p>
          <span className="mt-0.5 flex items-center gap-1">
            {priceLooksOffSpot && (
              <span title={t.transactions.priceOffSpot} className="cursor-help">
                <TriangleAlert
                  className="h-3 w-3 text-destructive"
                  aria-label={t.transactions.priceOffSpot}
                />
              </span>
            )}
            <MonoValue tone="muted" className="block text-[13.5px]">
              {formatUsd(pricePerDisplayUnit)}
            </MonoValue>
          </span>
        </div>
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">
            {t.transactions.currentValue}
          </p>
          {valuation.currentValueUsd ? (
            <MonoValue className="mt-0.5 block text-[13.5px]">
              {formatUsd(valuation.currentValueUsd)}
            </MonoValue>
          ) : (
            <span
              title={blankValueReason}
              className="cursor-help text-[13.5px] text-muted-foreground"
            >
              —
            </span>
          )}
        </div>
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">
            {t.transactions.pnl}
          </p>
          {valuation.pnlUsd ? (
            <MonoValue
              tone={isGain ? "gain" : "loss"}
              signed
              className="mt-0.5 block text-[13.5px]"
            >
              {formatUsd(valuation.pnlUsd)}
            </MonoValue>
          ) : (
            <span
              title={blankValueReason}
              className="cursor-help text-[13.5px] text-muted-foreground"
            >
              —
            </span>
          )}
        </div>
      </div>
      {expanded && (
        <TransactionDetail
          row={row}
          currentPricePerTroyOz={currentPricePerTroyOz}
          displayUnit={displayUnit}
          spotPerDamlungOnDate={spotPerDamlungOnDate(
            priceHistory,
            row.transactionDate,
          )}
        />
      )}
    </Panel>
  );
}

// State-lifted, presentational: `rows` and the mutation handlers all live
// in DashboardContent now (it needs the same merged optimistic list to
// recompute holdings/gain-loss instantly), not here. Failures are
// reported by DashboardContent's toast, so this component just renders.
// The compact overflow budget (5 desktop rows / 3 mobile cards, rest by
// scroll) and the row-click expander are local concerns, per
// dashboard-expansion-plan.md §4.1–§4.2.
export function TransactionHistory({
  rows,
  currentPricePerTroyOz,
  priceHistory = [],
  syncing = false,
  displayUnit = "damlung",
  onDelete,
  onBulkDelete,
  onAddClick,
  onEditSuccess,
  onCsvImported = () => {},
}: {
  rows: TransactionRow[];
  currentPricePerTroyOz: string;
  priceHistory?: ChartPoint[];
  syncing?: boolean;
  displayUnit?: GoldUnit;
  onDelete: (row: TransactionRow) => void;
  onBulkDelete: (ids: string[]) => Promise<boolean>;
  onAddClick: () => void;
  onEditSuccess: () => void;
  onCsvImported?: () => void;
}) {
  const { t } = useLocale();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkPending, setBulkPending] = useState(false);
  // Selection is opt-in: the tick-boxes, select-all, and the bulk bar only
  // render once the user presses "Select". Leaving select mode clears any
  // ticks so a stale selection can't linger invisibly.
  const [selectMode, setSelectMode] = useState(false);
  const selection = useRowSelection();
  const toggle = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  const enterSelectMode = () => {
    setExpandedId(null);
    setSelectMode(true);
  };
  const exitSelectMode = () => {
    setSelectMode(false);
    selection.clear();
  };

  // Optimistic (temp-) rows have no server id yet — keep them out of every
  // selection path so a bulk delete never ships a "temp-…" id.
  const selectableIds = useMemo(
    () => rows.filter((r) => !r.id.startsWith("temp-")).map((r) => r.id),
    [rows],
  );

  async function handleBulkConfirm() {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;
    setBulkPending(true);
    const ok = await onBulkDelete(ids);
    setBulkPending(false);
    if (ok) {
      selection.clear();
      setBulkOpen(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <Link
            href="/dashboard/transactions"
            className="tt-heading tt-bracket text-[15px] text-foreground transition-colors hover:text-primary"
          >
            {t.transactions.title} →
          </Link>
          {/* No dictionary key for this affordance; locale is en-only and
              dictionary.ts is frozen for this phase (see plan §11 Phase 0). */}
          <Link
            href="/dashboard/transactions"
            className="tt-label text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {(rows.length > 0 || selectMode) && (
            // Inline copy: locale is en-only and dictionary.ts is frozen
            // for this phase (see plan §11 Phase 0). Kept mounted while
            // select mode is active so Cancel stays reachable even if the
            // last row is deleted mid-selection.
            <button
              type="button"
              onClick={selectMode ? exitSelectMode : enterSelectMode}
              aria-pressed={selectMode}
              className={cn(
                "tt-label border px-2.5 py-1.5 text-[10.5px] transition-colors",
                selectMode
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {selectMode ? "Cancel" : "Select"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setCsvOpen(true)}
            className="tt-label border border-border px-2.5 py-1.5 text-[10.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {t.csv.importExport}
          </button>
          <Magnetic strength={10}>
            <Button size="sm" onClick={onAddClick}>
              <Plus className="h-4 w-4" />
              <span className="tt-label text-[11.5px]">
                {t.transactions.addTransaction}
              </span>
            </Button>
          </Magnetic>
        </div>
      </div>
      {syncing && (
        <div
          role="progressbar"
          aria-label={t.transactions.syncing}
          className="mb-3 h-0.5 w-full overflow-hidden bg-border"
        >
          <div className="h-full w-1/3 bg-primary motion-safe:animate-[sync-indeterminate_1.1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:opacity-40" />
        </div>
      )}
      {selection.selectedCount > 0 && (
        <BulkActionsBar
          count={selection.selectedCount}
          onClear={selection.clear}
          onDelete={() => setBulkOpen(true)}
          className="mb-3"
        />
      )}
      <AllRowsContext.Provider value={rows}>
        {/* ~5 body rows before the container scrolls (§4.1). */}
        <div className="hidden max-h-68 overflow-auto rounded-lg border border-border bg-card md:block">
          <table className="w-full min-w-140 border-collapse">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="tt-label border-b border-border text-[10.5px] text-muted-foreground">
                {selectMode && (
                  <th className="py-3 pr-1 pl-4">
                    <RowCheckbox
                      checked={selection.allSelected(selectableIds)}
                      onCheckedChange={() => selection.toggleAll(selectableIds)}
                      label="Select all transactions"
                    />
                  </th>
                )}
                <th className="py-3 pr-3 pl-2 text-left font-medium">
                  {t.transactions.date}
                </th>
                <th className="py-3 pr-3 text-left font-medium">
                  {t.transactions.quantity}
                </th>
                <th className="py-3 pr-3 text-right font-medium">
                  {t.transactions.paid}
                </th>
                <th className="py-3 pr-3 text-right font-medium">
                  /{unitLabels(t, displayUnit).primaryLower}
                </th>
                <th className="py-3 pr-3 text-right font-medium">
                  {t.transactions.currentValue}
                </th>
                <th className="py-3 pr-3 text-right font-medium">
                  {t.transactions.pnl}
                </th>
                <th className="py-3 pr-4" />
              </tr>
            </thead>
            <tbody className="px-4">
              {rows.map((row) => (
                <Row
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
                  onDelete={onDelete}
                  onEditSuccess={onEditSuccess}
                />
              ))}
            </tbody>
          </table>
        </div>
        {/* ~3 cards before this list scrolls inside the panel (§4.1). */}
        <div className="flex max-h-115 flex-col gap-3 overflow-auto md:hidden">
          {rows.map((row) => (
            <TransactionCard
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
              onDelete={onDelete}
              onEditSuccess={onEditSuccess}
            />
          ))}
        </div>
      </AllRowsContext.Provider>
      <BulkDeleteDialog
        open={bulkOpen}
        onOpenChange={(open) => !bulkPending && setBulkOpen(open)}
        count={selection.selectedCount}
        pending={bulkPending}
        onConfirm={handleBulkConfirm}
      />
      <CsvDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        rows={rows}
        onImported={onCsvImported}
      />
    </div>
  );
}
