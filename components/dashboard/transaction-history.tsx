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
import {
  TransactionDialog,
  type AddSettledResult,
  type EditableTransaction,
} from "./transaction-dialog";

export interface TransactionRow extends TransactionRowLike {
  id: string;
  transactionDate: string;
  notes?: string | null;
}

function RowActions({
  row,
  onDelete,
}: {
  row: TransactionRow;
  onDelete: (row: TransactionRow) => void;
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
      />
    </>
  );
}

function Row({
  row,
  currentPricePerTroyOz,
  onDelete,
}: {
  row: TransactionRow;
  currentPricePerTroyOz: string;
  onDelete: (row: TransactionRow) => void;
}) {
  const isBuy = row.type === "buy";
  const isPending = row.id.startsWith("temp-");
  const valuation = computeRowValuation(row, currentPricePerTroyOz);
  const isGain = valuation.pnlUsd !== null && Number(valuation.pnlUsd) >= 0;

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
        {row.currency === "USD"
          ? formatUsd(valuation.amountUsd ?? "0")
          : `${new Intl.NumberFormat("en-US").format(
              Number(new Decimal(row.quantity).times(row.pricePerUnit))
            )} KHR`}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums text-muted-foreground">
        {formatUsd(valuation.pricePerDamlung)}
      </td>
      <td className="py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums text-foreground">
        {valuation.currentValueUsd ? formatUsd(valuation.currentValueUsd) : "—"}
      </td>
      <td
        className={cn(
          "py-2.5 pr-3 text-right font-mono text-[13px] tabular-nums",
          valuation.pnlUsd === null && "text-muted-foreground",
          valuation.pnlUsd !== null && (isGain ? "text-state-gain" : "text-destructive")
        )}
      >
        {valuation.pnlUsd ? formatUsd(valuation.pnlUsd) : "—"}
      </td>
      <td className="py-2.5 pl-1 text-right">
        {isPending ? (
          <span className="text-[11.5px] text-muted-foreground">Saving…</span>
        ) : (
          <RowActions row={row} onDelete={onDelete} />
        )}
      </td>
    </tr>
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
  onDelete,
  onOptimisticAdd,
  onAddSettled,
}: {
  rows: TransactionRow[];
  currentPricePerTroyOz: string;
  error: string | null;
  onDelete: (row: TransactionRow) => void;
  onOptimisticAdd: (row: EditableTransaction) => void;
  onAddSettled: (tempId: string, result: AddSettledResult) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">
          Transaction History
        </h2>
        <TransactionDialog
          onOptimisticAdd={onOptimisticAdd}
          onAddSettled={onAddSettled}
        />
      </div>
      {error && (
        <div className="mb-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </div>
      )}
      <div className="max-h-80 overflow-auto rounded-lg border border-border bg-card">
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
                currentPricePerTroyOz={currentPricePerTroyOz}
                onDelete={onDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
