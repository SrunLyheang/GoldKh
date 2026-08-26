"use client";

import Decimal from "decimal.js";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { computeRowValuation, type TransactionRowLike } from "@/lib/calc/transactionRow";
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

export interface TransactionRow extends TransactionRowLike {
  id: string;
  transactionDate: string;
  notes?: string | null;
}

// Shared between the desktop table's Row and the mobile card list's
// TransactionCard so the two views can't drift on how a figure is
// derived or blanked out.
function getRowDisplay(row: TransactionRow, currentPricePerTroyOz: string) {
  const isBuy = row.type === "buy";
  const isPending = row.id.startsWith("temp-");
  const valuation = computeRowValuation(row, currentPricePerTroyOz);
  const isGain = valuation.pnlUsd !== null && Number(valuation.pnlUsd) >= 0;
  // Both cells fall back to "—" for two different reasons that used to
  // look identical: KHR conversion is deferred entirely (project-
  // overview.md), and a sell row simply has no ongoing position to
  // value. The title distinguishes them without a new Tooltip component.
  const blankValueReason =
    row.currency !== "USD"
      ? "KHR entries aren't converted to USD yet"
      : row.type === "sell"
        ? "Sell rows show proceeds, not an ongoing position"
        : undefined;
  const paidAmount =
    row.currency === "USD"
      ? formatUsd(valuation.amountUsd ?? "0")
      : `${new Intl.NumberFormat("en-US").format(
          Number(new Decimal(row.quantity).times(row.pricePerUnit))
        )} KHR`;

  return { isBuy, isPending, valuation, isGain, blankValueReason, paidAmount };
}

function RowActions({
  row,
  allRows,
  currentPricePerTroyOz,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  allRows: TransactionRow[];
  currentPricePerTroyOz: string;
  onDelete: (row: TransactionRow) => void;
  onEditSuccess: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="rounded-sm border border-destructive px-2 py-1 text-[11.5px] font-medium text-destructive hover:bg-destructive/10"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-sm border border-border px-2 py-1 text-[11.5px] font-medium text-muted-foreground hover:bg-accent"
        >
          Cancel
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
              aria-label={`Actions for ${row.type} of ${row.quantity} ${row.unit}`}
              className="shrink-0 rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          }
        />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setConfirming(true)}
          >
            <Trash2 />
            Delete
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
  allRows,
  currentPricePerTroyOz,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  allRows: TransactionRow[];
  currentPricePerTroyOz: string;
  onDelete: (row: TransactionRow) => void;
  onEditSuccess: () => void;
}) {
  const { isBuy, isPending, valuation, isGain, blankValueReason, paidAmount } =
    getRowDisplay(row, currentPricePerTroyOz);

  return (
    <tr
      className={cn(
        "border-b border-border last:border-0",
        isPending && "opacity-60"
      )}
    >
      <td className="py-2.5 pr-3 pl-4">
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
      <td className="py-2.5 pr-3 text-[13.5px] font-medium text-foreground">
        {isBuy ? "Buy" : "Sell"} {formatQuantity(row.quantity)} {row.unit}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums text-foreground">
        {paidAmount}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
        {formatUsd(valuation.pricePerDamlung)}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums text-foreground">
        {valuation.currentValueUsd ? (
          formatUsd(valuation.currentValueUsd)
        ) : (
          <span title={blankValueReason} className="cursor-help">—</span>
        )}
      </td>
      <td
        className={cn(
          "py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums",
          valuation.pnlUsd === null && "text-muted-foreground",
          valuation.pnlUsd !== null && (isGain ? "text-state-gain" : "text-destructive")
        )}
      >
        {valuation.pnlUsd ? (
          formatUsd(valuation.pnlUsd)
        ) : (
          <span title={blankValueReason} className="cursor-help">—</span>
        )}
      </td>
      <td className="py-2.5 pl-1 text-right">
        {isPending ? (
          <span className="text-[11.5px] text-muted-foreground">Saving…</span>
        ) : (
          <RowActions
            row={row}
            allRows={allRows}
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
  allRows,
  currentPricePerTroyOz,
  onDelete,
  onEditSuccess,
}: {
  row: TransactionRow;
  allRows: TransactionRow[];
  currentPricePerTroyOz: string;
  onDelete: (row: TransactionRow) => void;
  onEditSuccess: () => void;
}) {
  const { isBuy, isPending, valuation, isGain, blankValueReason, paidAmount } =
    getRowDisplay(row, currentPricePerTroyOz);

  return (
    <Panel className={cn("flex flex-col gap-3", isPending && "opacity-60")}>
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
              {isBuy ? "Buy" : "Sell"} {formatQuantity(row.quantity)} {row.unit}
            </p>
            <MonoValue tone="muted" className="text-[11.5px]">
              {row.transactionDate}
            </MonoValue>
          </div>
        </div>
        {isPending ? (
          <span className="shrink-0 text-[11.5px] text-muted-foreground">
            Saving…
          </span>
        ) : (
          <RowActions
            row={row}
            allRows={allRows}
            currentPricePerTroyOz={currentPricePerTroyOz}
            onDelete={onDelete}
            onEditSuccess={onEditSuccess}
          />
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-border pt-3">
        <div>
          <p className="text-[11.5px] text-muted-foreground">Paid</p>
          <MonoValue className="text-[13px]">{paidAmount}</MonoValue>
        </div>
        <div>
          <p className="text-[11.5px] text-muted-foreground">/damlung</p>
          <MonoValue tone="muted" className="text-[13px]">
            {formatUsd(valuation.pricePerDamlung)}
          </MonoValue>
        </div>
        <div>
          <p className="text-[11.5px] text-muted-foreground">Current Value</p>
          {valuation.currentValueUsd ? (
            <MonoValue className="text-[13px]">
              {formatUsd(valuation.currentValueUsd)}
            </MonoValue>
          ) : (
            <span title={blankValueReason} className="cursor-help text-[13px] text-muted-foreground">
              —
            </span>
          )}
        </div>
        <div>
          <p className="text-[11.5px] text-muted-foreground">P&amp;L</p>
          {valuation.pnlUsd ? (
            <MonoValue tone={isGain ? "gain" : "loss"} className="text-[13px]">
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
  successMessage,
  onDelete,
  onAddClick,
  onEditSuccess,
}: {
  rows: TransactionRow[];
  currentPricePerTroyOz: string;
  error: string | null;
  successMessage: string | null;
  onDelete: (row: TransactionRow) => void;
  onAddClick: () => void;
  onEditSuccess: () => void;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-foreground">
          Transaction History
        </h2>
        <Button size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          Add transaction
        </Button>
      </div>
      {error && <InlineBanner variant="error">{error}</InlineBanner>}
      {successMessage && (
        <InlineBanner variant="success">{successMessage}</InlineBanner>
      )}
      <div className="hidden max-h-80 overflow-auto rounded-lg border border-border bg-card md:block">
        <table className="w-full min-w-140 border-collapse">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border text-[11.5px] font-medium text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">Date</th>
              <th className="py-2.5 pr-3 text-left font-medium">Quantity</th>
              <th className="py-2.5 pr-3 text-right font-medium">Paid</th>
              <th className="py-2.5 pr-3 text-right font-medium">/damlung</th>
              <th className="py-2.5 pr-3 text-right font-medium">Current Value</th>
              <th className="py-2.5 pr-3 text-right font-medium">P&amp;L</th>
              <th className="py-2.5 pr-4" />
            </tr>
          </thead>
          <tbody className="px-4">
            {rows.map((row) => (
              <Row
                key={row.id}
                row={row}
                allRows={rows}
                currentPricePerTroyOz={currentPricePerTroyOz}
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
            allRows={rows}
            currentPricePerTroyOz={currentPricePerTroyOz}
            onDelete={onDelete}
            onEditSuccess={onEditSuccess}
          />
        ))}
      </div>
    </div>
  );
}
