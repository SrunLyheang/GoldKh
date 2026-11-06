"use client";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { formatKhr, formatQuantity, formatUsd } from "@/lib/format/money";
import { formatEntryDate } from "@/lib/format/datetime";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MonoValue } from "./mono-value";
import {
  AllRowsContext,
  RowActions,
  getRowDisplay,
  type TransactionRow,
} from "./transaction-history";

const SHOWN = 7;

// The right-hand page: the latest entries written the way you'd write
// them in a notebook ("Bought 2 chi at $455 a chi"), your own note under
// each in your hand, and how each buy stands today. Edit and delete stay
// one tap away on every line; selecting many, CSV and the full table
// live on the Ledger page, because they're rare.
export function RecentEntries({
  rows,
  currentPricePerTroyOz,
  syncing,
  onAddClick,
  onDelete,
  onEditSuccess,
}: {
  rows: TransactionRow[];
  currentPricePerTroyOz: string;
  syncing: boolean;
  onAddClick: () => void;
  onDelete: (row: TransactionRow) => void;
  onEditSuccess: () => void;
}) {
  const shown = rows.slice(0, SHOWN);

  return (
    <section aria-labelledby="recent-entries" className="flex h-full flex-col">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-3">
        <h2 id="recent-entries" className="tt-heading text-figure text-foreground">
          {t.recent.title}
        </h2>
        <Button onClick={onAddClick} className="press hidden md:inline-flex">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t.transactions.addTransaction}
        </Button>
      </div>
      <p className="mt-0.5 min-h-5 text-label text-faint" role="status">
        {syncing ? t.transactions.syncing : t.recent.subtitle(rows.length)}
      </p>

      <AllRowsContext.Provider value={rows}>
        <ol className="mt-4 flex flex-col">
          {shown.map((row) => (
            <Entry
              key={row.id}
              row={row}
              currentPricePerTroyOz={currentPricePerTroyOz}
              onDelete={onDelete}
              onEditSuccess={onEditSuccess}
            />
          ))}
        </ol>
      </AllRowsContext.Provider>

      <Link
        href="/dashboard/transactions"
        className="press group mt-auto inline-flex min-h-11 items-center gap-2 self-start pt-6 text-detail font-medium text-gold"
      >
        {rows.length > SHOWN
          ? t.recent.allEntries(rows.length)
          : t.recent.openLedger}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-(--dur-micro) group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </section>
  );
}

function Entry({
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
  const { isBuy, isPending, valuation, isGain, blankValueReason } =
    getRowDisplay(row, currentPricePerTroyOz, row.unit);
  const unit = unitLabels(row.unit).primaryLower;
  const price =
    row.currency === "USD" ? formatUsd(row.pricePerUnit) : formatKhr(row.pricePerUnit);

  return (
    <li
      className={cn(
        "grid grid-cols-[1fr_auto_auto] items-baseline gap-x-3 py-1.5 sm:grid-cols-[4.25rem_1fr_auto_auto]",
        isPending && "ink-write opacity-70",
      )}
    >
      <span className="col-span-full text-label text-faint tabular-nums sm:col-span-1">
        {formatEntryDate(row.transactionDate)}
      </span>
      <span className="min-w-0 text-body text-foreground">
        {isBuy ? t.recent.bought : t.recent.sold}{" "}
        <MonoValue className="font-medium">
          {formatQuantity(row.quantity)} {unit}
        </MonoValue>{" "}
        <span className="text-muted-foreground">
          {t.recent.at} <MonoValue tone="muted">{price}</MonoValue>
        </span>
      </span>
      <span className="text-right text-detail">
        {isPending ? (
          <span className="text-faint">{t.transactions.saving}</span>
        ) : valuation.pnlUsd ? (
          <MonoValue signed tone={isGain ? "gain" : "loss"} className="font-medium">
            {formatUsd(valuation.pnlUsd)}
          </MonoValue>
        ) : (
          <span className="text-faint" title={blankValueReason}>
            {row.currency !== "USD" ? t.recent.inRiel : t.recent.soldNote}
          </span>
        )}
      </span>
      <span className="-my-2 w-9">
        {!isPending && (
          <RowActions
            row={row}
            currentPricePerTroyOz={currentPricePerTroyOz}
            onDelete={onDelete}
            onEditSuccess={onEditSuccess}
          />
        )}
      </span>
      {row.notes && (
        <span className="hand col-span-2 -mt-0.5 truncate text-detail sm:col-start-2 sm:col-end-4" title={row.notes}>
          {row.notes}
        </span>
      )}
    </li>
  );
}
