# Fix: Realized P&L replayed newest-first (2026-08-31)

## Symptom (user-reported)

- Bought **10 chi (= 1 damlung) @ $5,585** on 2026-08-30.
- Sold **1 damlung @ $5,200** on 2026-08-31.
- Realized panel showed **`$5,200.00` at `0.00%`**.
- Expected: **−$385 (−6.9%)** — the sale price minus what was paid for
  that gold.

## Root cause

`computeHoldings` (`lib/calc/holdings.ts`) and `computeRealized`
(`lib/calc/realized.ts`) replay the ledger **forward in time**, keeping a
running weighted-average cost. Their doc comments state they require
**oldest-first** input.

Every caller instead passed `listTransactionsForUser`'s result, which is
ordered `desc(transaction_date)` — **newest-first**, for the history
table. So the **sell (Aug 31) was processed before the buy (Aug 30)**.
At that point the position was empty, so the sale got a **cost basis of
$0** and the full $5,200 of proceeds was reported as "realized," with no
percentage (`soldCostBasisUsd` was 0).

The Position card masked the bug because buy 10 chi then sell 1 damlung
nets to **zero quantity**, so "0 holdings / $0 avg cost" was correct by
coincidence.

Tests never caught it: every case in `realized.test.ts` /
`holdings.test.ts` passes entries already in chronological order.

## Fix

### New file: `lib/calc/chronological.ts`

```ts
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
```

Pure, lives in `lib/calc/`. Stable sort → same-day rows keep caller
order. Does not mutate input.

### `components/dashboard/dashboard-content.tsx`

- Import `toChronological`.
- Before the calc block:
  ```ts
  const chronological = toChronological(rows);
  const holdings = computeHoldings(chronological);
  // computeGainLoss unchanged (takes holdings numbers)
  const realized = computeRealized(chronological);
  ```
- History table still renders `rows` (newest-first) unchanged.

### `components/insights/insights-content.tsx`

- Import `toChronological`.
- `const chronological = useMemo(() => toChronological(transactions), [transactions])`.
- `computeHoldings` and `computeRealized` now take `chronological`
  (deps updated to `[chronological]`).
- `computeInsights`, `buildPortfolioSeries`, `computeBuyQuality` left on
  `transactions` — they sort/filter by date internally or are
  order-independent.

### New file: `lib/calc/chronological.test.ts`

Covers: reorder newest→oldest, no mutation, stable for same-day, and a
regression that feeds the exact user scenario as a newest-first ledger
(`computeRealized` reads $5,200 — the bug) vs. sorted (−$385 — correct).

## Verification

- `npx vitest run` — 157 calc/dashboard/insights tests green (18 in the
  three directly-touched calc files).
- `npm run lint` — clean (only pre-existing warnings in
  `transaction-history.tsx`).

## Known limitation (pre-existing, not addressed)

`transaction_date` is a SQL `date` (day granularity). A **same-day**
buy-then-sell has no defined replay order — the DB query doesn't
tiebreak either. A `created_at` tiebreaker would need threading through
`TransactionRow` (`components/dashboard/transaction-history.tsx:40`), the
query select, and the optimistic-transactions type. Deferred.

## Files changed

- `lib/calc/chronological.ts` (new)
- `lib/calc/chronological.test.ts` (new)
- `components/dashboard/dashboard-content.tsx`
- `components/insights/insights-content.tsx`
- `context/progress-tracker.md` (entry added)
