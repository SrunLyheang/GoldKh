"use client";

import Decimal from "decimal.js";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Pencil,
  TriangleAlert,
  Trash2,
} from "lucide-react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { computeRowValuation } from "@/lib/calc/transactionRow";
import type { LedgerEntry } from "@/lib/calc/ledgerEntry";
import { priceFromTroyOz, type GoldUnit } from "@/lib/calc/units";
import { classifyPrice, isHardVerdict } from "@/lib/validation/priceSanity";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineBanner } from "./inline-banner";
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
// derived or blanked out.
function getRowDisplay(
  row: TransactionRow,
  currentPricePerTroyOz: string,
  displayUnit: GoldUnit,
  t: Dictionary
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
        Number(priceFromTroyOz(currentPricePerTroyOz, displayUnit))
      )
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
          Number(new Decimal(row.quantity).times(row.pricePerUnit))
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
// carrying a prop they never touch.
const AllRowsContext = createContext<TransactionRow[]>([]);

function RowActions({
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
                unitLabels(t, row.unit).primary
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

function Row({
  row,
  currentPricePerTroyOz,
  displayUnit,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  currentPricePerTroyOz: string;
  displayUnit: GoldUnit;
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
    <tr
      className={cn(
        "border-b border-border last:border-0",
        isPending && "opacity-60"
      )}
    >
      <td className="py-3 pr-3 pl-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
              isBuy ? "bg-state-gain/15" : "bg-destructive/15"
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
          <span title={blankValueReason} className="cursor-help">—</span>
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
          <span title={blankValueReason} className="cursor-help text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 pl-1 text-right">
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
  );
}

// Same data as Row, laid out as a card instead of a table row — the
// mobile substitute for the table, which would otherwise force
// sideways scrolling on phone widths.
function TransactionCard({
  row,
  currentPricePerTroyOz,
  displayUnit,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  currentPricePerTroyOz: string;
  displayUnit: GoldUnit;
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
    <Panel className={cn("flex flex-col gap-3.5", isPending && "opacity-60")}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-md",
              isBuy ? "bg-state-gain/15" : "bg-destructive/15"
            )}
          >
            {isBuy ? (
              <ArrowDownLeft className="h-3.5 w-3.5 text-state-gain" />
            ) : (
              <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-medium text-foreground">
              {isBuy ? t.transactions.buy : t.transactions.sell}{" "}
              {formatQuantity(row.quantity)} {unitLabel}
            </p>
            <MonoValue tone="muted" className="text-[11.5px]">
              {row.transactionDate}
            </MonoValue>
          </div>
        </div>
        {isPending ? (
          <span className="shrink-0 text-[11.5px] text-muted-foreground">
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
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-3.5">
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">{t.transactions.paid}</p>
          <MonoValue className="mt-0.5 block text-[13px]">{paidAmount}</MonoValue>
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
            <MonoValue tone="muted" className="block text-[13px]">
              {formatUsd(pricePerDisplayUnit)}
            </MonoValue>
          </span>
        </div>
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">{t.transactions.currentValue}</p>
          {valuation.currentValueUsd ? (
            <MonoValue className="mt-0.5 block text-[13px]">
              {formatUsd(valuation.currentValueUsd)}
            </MonoValue>
          ) : (
            <span title={blankValueReason} className="cursor-help text-[13px] text-muted-foreground">
              —
            </span>
          )}
        </div>
        <div>
          <p className="tt-label text-[10.5px] text-muted-foreground">{t.transactions.pnl}</p>
          {valuation.pnlUsd ? (
            <MonoValue tone={isGain ? "gain" : "loss"} signed className="mt-0.5 block text-[13px]">
              {formatUsd(valuation.pnlUsd)}
            </MonoValue>
          ) : (
            <span title={blankValueReason} className="cursor-help text-[13px] text-muted-foreground">
              —
            </span>
          )}
        </div>
      </div>
    </Panel>
  );
}

// State-lifted, presentational: `rows`/`error` and the mutation handlers
// all live in DashboardContent now (it needs the same merged optimistic
// list to recompute holdings/gain-loss instantly), not here. This
// component just renders them.
export function TransactionHistory({
  rows,
  currentPricePerTroyOz,
  error,
  syncing = false,
  displayUnit = "damlung",
  onDelete,
  onAddClick,
  onEditSuccess,
}: {
  rows: TransactionRow[];
  currentPricePerTroyOz: string;
  error: string | null;
  syncing?: boolean;
  displayUnit?: GoldUnit;
  onDelete: (row: TransactionRow) => void;
  onAddClick: () => void;
  onEditSuccess: () => void;
}) {
  const { t } = useLocale();
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="tt-heading tt-bracket text-[15px] text-foreground">
          {t.transactions.title}
        </h2>
        <Button size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          <span className="tt-label text-[11.5px]">{t.transactions.addTransaction}</span>
        </Button>
      </div>
      {syncing && (
        <div
          role="progressbar"
          aria-label={t.transactions.syncing}
          className="mb-3 h-0.5 w-full overflow-hidden bg-border"
        >
          <div className="h-full w-1/3 bg-primary motion-safe:animate-[vault-indeterminate_1.1s_ease-in-out_infinite] motion-reduce:w-full motion-reduce:opacity-40" />
        </div>
      )}
      {error && <InlineBanner variant="error">{error}</InlineBanner>}
      <AllRowsContext.Provider value={rows}>
        <div className="hidden max-h-80 overflow-auto rounded-lg border border-border bg-card md:block">
          <table className="w-full min-w-140 border-collapse">
            <thead className="sticky top-0 bg-card">
              <tr className="tt-label border-b border-border text-[10.5px] text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">{t.transactions.date}</th>
                <th className="py-3 pr-3 text-left font-medium">{t.transactions.quantity}</th>
                <th className="py-3 pr-3 text-right font-medium">{t.transactions.paid}</th>
                <th className="py-3 pr-3 text-right font-medium">
                  /{unitLabels(t, displayUnit).primaryLower}
                </th>
                <th className="py-3 pr-3 text-right font-medium">{t.transactions.currentValue}</th>
                <th className="py-3 pr-3 text-right font-medium">{t.transactions.pnl}</th>
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
                  onDelete={onDelete}
                  onEditSuccess={onEditSuccess}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 md:hidden">
          {rows.map((row) => (
            <TransactionCard
              key={row.id}
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              displayUnit={displayUnit}
              onDelete={onDelete}
              onEditSuccess={onEditSuccess}
            />
          ))}
        </div>
      </AllRowsContext.Provider>
    </div>
  );
}
