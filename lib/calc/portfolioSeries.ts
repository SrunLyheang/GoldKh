import Decimal from "decimal.js";
import { computeHoldings } from "./holdings";
import type { LedgerEntry } from "./ledgerEntry";

// A ledger entry plus its calendar date — the only extra field this needs.
export interface DatedLedgerEntry extends LedgerEntry {
  transactionDate: string;
}

// A price_snapshot flattened to: capture instant as epoch-ms (crosses the
// server/client boundary cleanly) and the canonical USD/troy-oz price.
export interface PriceSnapshotPoint {
  t: number;
  pricePerTroyOz: string;
}

export interface PortfolioSeriesPoint {
  t: number;
  marketValueUsd: string;
  costBasisUsd: string;
}

// Portfolio value reconstructed at each price snapshot — no portfolio table,
// no cron. For each snapshot instant `t`, replay every transaction dated on
// or before that day, take weighted-average holdings, value two ways:
//   cost basis   = totalTroyOz × averageCostPerTroyOz
//   market value = totalTroyOz × snapshot price
// Pure: no I/O, no Date.now(). KHR rows excluded by computeHoldings.
export function buildPortfolioSeries(
  transactions: DatedLedgerEntry[],
  snapshots: PriceSnapshotPoint[],
): PortfolioSeriesPoint[] {
  const ordered = [...snapshots].sort((a, b) => a.t - b.t);

  // computeHoldings runs a running weighted average, so replay must be
  // chronological (the ledger is usually newest-first). Parse each
  // transactionDate once and reuse the timestamp for snapshot filtering.
  const timeline = transactions
    .map((tx) => ({ tx, at: new Date(tx.transactionDate).getTime() }))
    .sort((a, b) => a.at - b.at);

  return ordered.map((snapshot) => {
    const upToHere = timeline
      .filter((entry) => entry.at <= snapshot.t)
      .map((entry) => entry.tx);
    const { totalTroyOz, averageCostPerTroyOz } = computeHoldings(upToHere);

    const qty = new Decimal(totalTroyOz);
    const costBasis = qty.times(averageCostPerTroyOz);
    const marketValue = qty.times(snapshot.pricePerTroyOz);

    return {
      t: snapshot.t,
      marketValueUsd: marketValue.toString(),
      costBasisUsd: costBasis.toString(),
    };
  });
}
