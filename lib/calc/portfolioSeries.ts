import Decimal from "decimal.js";
import { computeHoldings } from "./holdings";
import type { LedgerEntry } from "./ledgerEntry";

// A ledger entry plus the calendar date it happened on — the only extra
// field the portfolio series needs over the valuation shape.
export interface DatedLedgerEntry extends LedgerEntry {
  transactionDate: string;
}

// A stored price_snapshot flattened to what this module needs: the
// capture instant as an epoch-ms number (crosses the server→client
// boundary cleanly, unlike a Date) and the canonical USD/troy-oz price.
export interface PriceSnapshotPoint {
  t: number;
  pricePerTroyOz: string;
}

export interface PortfolioSeriesPoint {
  t: number;
  marketValueUsd: string;
  costBasisUsd: string;
}

// Portfolio value reconstructed at each stored price snapshot — no
// dedicated portfolio_snapshots table, no cron (architecture.md,
// dashboard-expansion-plan.md §2/§8). For each snapshot instant `t`,
// replay every transaction dated on or before that day, take the
// weighted-average holdings, and value them two ways:
//   cost basis  = totalTroyOz × averageCostPerTroyOz  (what was put in)
//   market value = totalTroyOz × snapshot price       (what it's worth)
// Pure: no I/O, no Date.now(). KHR rows are excluded by computeHoldings.
export function buildPortfolioSeries(
  transactions: DatedLedgerEntry[],
  snapshots: PriceSnapshotPoint[],
): PortfolioSeriesPoint[] {
  const ordered = [...snapshots].sort((a, b) => a.t - b.t);

  // computeHoldings runs a running weighted average, so a sell replayed
  // before the buy that funds it skews the basis. Normalise to
  // chronological order here rather than trusting caller order (the
  // ledger is usually newest-first). Parse each transactionDate once and
  // reuse the timestamp for snapshot filtering.
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
