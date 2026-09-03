import { computeGainLoss, type GainLoss } from "./gainLoss";
import { computeHoldings, type Holdings } from "./holdings";
import { computeRealized, type Realized } from "./realized";
import { toChronological } from "./chronological";
import type { DatedLedgerEntry } from "./portfolioSeries";
import { priceFromTroyOz } from "./units";

export interface Position {
  holdings: Holdings;
  gainLoss: GainLoss;
  realized: Realized;
  hasHoldings: boolean;
  // Weighted-average cost expressed per damlung — the break-even line the
  // charts draw. `undefined` when nothing is held, so a caller can drop
  // the reference line entirely.
  breakEvenPerDamlung: number | undefined;
}

// One replay of the ledger, the way every "how is my position doing?"
// surface needs it. computeHoldings / computeRealized walk a running
// weighted average forward in time, so the ledger has to be sorted
// oldest-first first — a step every call site was repeating by hand, and
// app/dashboard/price/page.tsx was silently skipping (see CONTEXT.md
// "replay ordering"). Sorting here makes the ordering impossible to
// forget.
//
// Pure: no I/O, no Date.now(). Callers own the useMemo.
export function computePosition(
  entries: DatedLedgerEntry[],
  pricePerTroyOz: string,
): Position {
  const chronological = toChronological(entries);
  const holdings = computeHoldings(chronological);
  const gainLoss = computeGainLoss(
    holdings.totalTroyOz,
    holdings.averageCostPerTroyOz,
    pricePerTroyOz,
  );
  const realized = computeRealized(chronological);
  const hasHoldings = Number(holdings.totalTroyOz) > 0;

  return {
    holdings,
    gainLoss,
    realized,
    hasHoldings,
    breakEvenPerDamlung: hasHoldings
      ? Number(priceFromTroyOz(holdings.averageCostPerTroyOz, "damlung"))
      : undefined,
  };
}
