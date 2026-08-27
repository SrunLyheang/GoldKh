import type { GoldUnit } from "./units";

// The calc layer's view of one transaction: just the fields any valuation
// rule needs, with no id, date, or notes. Both computeHoldings (aggregate,
// in holdings.ts) and computeRowValuation (per-row, in transactionRow.ts)
// take this exact shape — it used to be declared twice, byte-identical,
// as TransactionLike and TransactionRowLike.
export interface LedgerEntry {
  type: "buy" | "sell";
  quantity: string;
  unit: GoldUnit;
  pricePerUnit: string;
  currency: "USD" | "KHR";
}

// A LedgerEntry carrying its row id, so a caller can exclude one specific
// row (e.g. "compute holdings as if the row being edited didn't exist
// yet") without a circular import between the calc layer and the
// transaction components.
export interface LedgerEntryWithId extends LedgerEntry {
  id: string;
}

// How a ledger entry behaves under valuation. The two axes — is it USD,
// and is it a buy or a sell — are the same for the aggregate and the
// per-row rules, even though each acts on the answer differently:
//
// - non-usd  — KHR conversion is deferred entirely (project-overview.md),
//              so the aggregate skips the row and the per-row view blanks
//              every USD figure.
// - sale     — a sell has no ongoing position to value: the aggregate
//              draws down quantity at the running average cost, the
//              per-row view shows proceeds but no current value or P&L.
// - open-buy — a USD buy: the only entry that adds to the position and
//              carries a live current value and P&L.
export type EntryClass = "non-usd" | "sale" | "open-buy";

export function classifyEntry(entry: LedgerEntry): EntryClass {
  if (entry.currency !== "USD") return "non-usd";
  return entry.type === "sell" ? "sale" : "open-buy";
}
