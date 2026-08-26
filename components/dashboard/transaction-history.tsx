"use client";

import Decimal from "decimal.js";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/format/money";
import { computeRowValuation, type TransactionRowLike } from "@/lib/calc/transactionRow";
import { AddTransactionDialog } from "./add-transaction-dialog";

export interface TransactionRow extends TransactionRowLike {
  id: string;
  transactionDate: string;
}

function DeleteButton({
  label,
  onConfirm,
}: {
  label: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onConfirm}
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
    <button
      type="button"
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${label}`}
      className="shrink-0 rounded-sm p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
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
  const valuation = computeRowValuation(row, currentPricePerTroyOz);
  const isGain = valuation.pnlUsd !== null && Number(valuation.pnlUsd) >= 0;

  return (
    <tr className="border-b border-border last:border-0">
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
        {isBuy ? "Buy" : "Sell"} {row.quantity} {row.unit}
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
        <DeleteButton
          label={`${row.type} of ${row.quantity} ${row.unit}`}
          onConfirm={() => onDelete(row)}
        />
      </td>
    </tr>
  );
}

export function TransactionHistory({
  transactions,
  currentPricePerTroyOz,
}: {
  transactions: TransactionRow[];
  currentPricePerTroyOz: string;
}) {
  const router = useRouter();
  // Optimistically-removed ids, not a mirrored copy of `transactions` —
  // rows are derived from props each render, so a failed delete "puts
  // the UI back" just by dropping the id back out of this set, and a
  // successful one is naturally reflected once router.refresh() sends
  // fresh props with that row already gone.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const rows = transactions.filter((row) => !removedIds.has(row.id));

  useEffect(() => {
    if (!error) return;
    const timeout = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timeout);
  }, [error]);

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
      // Put it back — the backend didn't confirm the delete.
      setRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(row.id);
        return next;
      });
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Couldn't delete — please try again.");
      return;
    }

    // Holdings/gain-loss/chart derive from the full transaction list on
    // the server, so a real re-fetch is still needed to keep those in
    // sync — the row itself is already gone from the UI by this point.
    router.refresh();
  }

  return (
    <div id="history" className="scroll-mt-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">
          Transaction History
        </h2>
        <AddTransactionDialog />
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
                onDelete={handleDelete}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
