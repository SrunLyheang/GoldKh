"use client";

// Shared row pieces for every list of transactions (today's Recent
// entries and the Ledger page): the row type, the one derivation of what
// a row displays, and the per-row edit / delete menu.

import Decimal from "decimal.js";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { formatKhr, formatUsd } from "@/lib/format/money";
import { computeRowValuation } from "@/lib/calc/transactionRow";
import type { LedgerEntry } from "@/lib/calc/ledgerEntry";
import { priceFromTroyOz, type GoldUnit } from "@/lib/calc/units";
import { classifyPrice, isHardVerdict } from "@/lib/validation/priceSanity";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TransactionDialog } from "./transaction-dialog";

export interface TransactionRow extends LedgerEntry {
  id: string;
  transactionDate: string;
  notes?: string | null;
}

// Shared by desktop Row, mobile TransactionCard, and the full transactions
// route so the views can't drift on how a figure is derived or blanked.
export function getRowDisplay(
  row: TransactionRow,
  currentPricePerTroyOz: string,
  displayUnit: GoldUnit,
) {
  const isBuy = row.type === "buy";
  const isPending = row.id.startsWith("temp-");
  const valuation = computeRowValuation(row, currentPricePerTroyOz);
  const pricePerDisplayUnit =
    displayUnit === "chi" ? valuation.pricePerChi : valuation.pricePerDamlung;
  const isGain = valuation.pnlUsd !== null && Number(valuation.pnlUsd) >= 0;
  // Flag a USD row whose per-unit price is >10× off spot (same hard band as
  // the Add dialog's guard) — usually a total typed into the per-unit field.
  // User-corrected, not auto.
  const priceLooksOffSpot =
    row.currency === "USD" &&
    isHardVerdict(
      classifyPrice(
        Number(pricePerDisplayUnit),
        Number(priceFromTroyOz(currentPricePerTroyOz, displayUnit)),
      ),
    );
  // "—" for two distinct reasons: KHR conversion is deferred, or a sell row
  // has no ongoing position to value. title disambiguates.
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
  // Lowercase to match the pre-i18n "10 chi"/"3 damlung" convention.
  const unitLabel = unitLabels(row.unit).primaryLower;
  // A riel row's per-unit price is in riel — never print it with "$".
  const perUnitLabel =
    row.currency === "USD"
      ? formatUsd(pricePerDisplayUnit)
      : formatKhr(pricePerDisplayUnit);

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
    perUnitLabel,
  };
}

// Full row list, needed only by RowActions (holdings excluding the row being
// edited). Context avoids threading a prop through Row/TransactionCard.
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => onDelete(row)}
          className="press min-h-9 rounded-md bg-destructive/15 px-3 text-detail font-semibold text-destructive hover:bg-destructive/25"
        >
          {t.transactions.delete}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="press min-h-9 rounded-md px-3 text-detail text-muted-foreground hover:bg-(--glow-color)"
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
                unitLabels(row.unit).primary,
              )}
              className="press tap-target shrink-0 rounded-md p-2 text-faint hover:bg-(--glow-color) hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
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
