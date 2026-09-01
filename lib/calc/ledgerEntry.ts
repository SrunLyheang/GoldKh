import type { GoldUnit } from "./units";

// The calc layer's view of one transaction: only the fields a valuation
// rule needs (no id/date/notes). Shared by computeHoldings and
// computeRowValuation.
export interface LedgerEntry {
  type: "buy" | "sell";
  quantity: string;
  unit: GoldUnit;
  pricePerUnit: string;
  currency: "USD" | "KHR";
}

// LedgerEntry + row id, so a caller can exclude one row (e.g. holdings as
// if the row being edited didn't exist) without a circular import.
export interface LedgerEntryWithId extends LedgerEntry {
  id: string;
}

// How a ledger entry behaves under valuation (axes: USD?, buy or sell?):
// - non-usd  — KHR conversion is deferred: aggregate skips it, per-row
//              blanks every USD figure.
// - sale     — no ongoing position: aggregate draws down quantity at the
//              running average cost; per-row shows proceeds, no value/P&L.
// - open-buy — a USD buy: the only entry that adds to the position and
//              carries a live current value and P&L.
export type EntryClass = "non-usd" | "sale" | "open-buy";

export function classifyEntry(entry: LedgerEntry): EntryClass {
  if (entry.currency !== "USD") return "non-usd";
  return entry.type === "sell" ? "sale" : "open-buy";
}
