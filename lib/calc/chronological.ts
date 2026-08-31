// The transaction list is stored and displayed newest-first
// (listTransactionsForUser orders by `desc(transaction_date)` for the
// history table). But the replay-based aggregates — computeHoldings and
// computeRealized — walk a running weighted-average forward in time and
// only make sense oldest-first: a sell has to see the buys that came
// before it, or it draws down an empty position at zero cost basis.
//
// This returns an oldest-first copy, keyed on `transactionDate`. The sort
// is stable, so same-day rows keep the order the caller passed them in
// (`transaction_date` is day-granular — there is no intra-day tiebreak
// anywhere in the app today).
export function toChronological<T extends { transactionDate: string }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) =>
    a.transactionDate < b.transactionDate
      ? -1
      : a.transactionDate > b.transactionDate
        ? 1
        : 0,
  );
}
