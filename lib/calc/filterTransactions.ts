import Decimal from "decimal.js";
import { computeRowValuation } from "./transactionRow";
import type { GoldUnit } from "./units";

// The fields the full transactions route filters and sorts on. Callers
// pass their richer row type through unchanged — the generic keeps the id
// and everything else intact.
export interface FilterableTransaction {
  type: "buy" | "sell";
  quantity: string;
  unit: GoldUnit;
  pricePerUnit: string;
  currency: "USD" | "KHR";
  transactionDate: string;
}

export interface FilterCriteria {
  // total = pricePerUnit x quantity, matched within +/-10%.
  amountPaid?: number;
  dateFrom?: string;
  dateTo?: string;
  // Exact quantity; unit is only compared when quantityUnit is set.
  quantity?: number;
  quantityUnit?: GoldUnit;
  direction?: "all" | "buy" | "sell";
  sortBy?: "date" | "pnl";
  sortDir?: "asc" | "desc";
}

const AMOUNT_TOLERANCE = 0.1;

function totalPaid(row: FilterableTransaction): Decimal {
  return new Decimal(row.pricePerUnit).times(row.quantity);
}

function matches(row: FilterableTransaction, c: FilterCriteria): boolean {
  if (c.amountPaid !== undefined) {
    const target = new Decimal(c.amountPaid);
    const diff = totalPaid(row).minus(target).abs();
    if (diff.gt(target.times(AMOUNT_TOLERANCE))) return false;
  }
  if (c.dateFrom !== undefined && row.transactionDate < c.dateFrom) return false;
  if (c.dateTo !== undefined && row.transactionDate > c.dateTo) return false;
  if (c.quantity !== undefined) {
    if (!new Decimal(row.quantity).equals(c.quantity)) return false;
    if (c.quantityUnit !== undefined && row.unit !== c.quantityUnit) return false;
  }
  if (
    c.direction !== undefined &&
    c.direction !== "all" &&
    row.type !== c.direction
  ) {
    return false;
  }
  return true;
}

// Pure filter + sort over already-loaded rows. `currentPricePerTroyOz`
// feeds the per-row P&L used by the "pnl" sort; rows with no P&L (sells,
// KHR) always sort to the end regardless of direction.
export function filterTransactions<T extends FilterableTransaction>(
  rows: T[],
  criteria: FilterCriteria,
  currentPricePerTroyOz: string
): T[] {
  const sortBy = criteria.sortBy ?? "date";
  const sortDir = criteria.sortDir ?? "desc";
  const dir = sortDir === "asc" ? 1 : -1;

  const filtered = rows.filter((row) => matches(row, criteria));

  const pnl = (row: T): number | null => {
    const v = computeRowValuation(row, currentPricePerTroyOz).pnlUsd;
    return v === null ? null : Number(v);
  };

  return filtered.sort((a, b) => {
    if (sortBy === "pnl") {
      const pa = pnl(a);
      const pb = pnl(b);
      if (pa === null && pb === null) return 0;
      if (pa === null) return 1; // nulls last, both directions
      if (pb === null) return -1;
      if (pa !== pb) return (pa - pb) * dir;
    }
    // date is the default and the tie-breaker for equal P&L
    if (a.transactionDate !== b.transactionDate) {
      return a.transactionDate < b.transactionDate ? -dir : dir;
    }
    return 0;
  });
}
