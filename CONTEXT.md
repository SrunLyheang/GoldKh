# Context — GoldKh

The domain language and the load-bearing rules of the codebase. Source
comments point here instead of restating a rule five times. Product framing
lives in `PRODUCT.md`; visual/UI rules live in `DESIGN.md`.

---

## Glossary

- **Ledger entry** — the calc layer's view of one transaction: `type`
  (buy/sell), `quantity`, `unit` (chi/damlung), `pricePerUnit`, `currency`
  (USD/KHR). No id, date, or notes. See `lib/calc/ledgerEntry.ts`.
- **Position** — a user's current standing, derived from their whole
  transaction list on every load: holdings, weighted-average cost, market
  value, and unrealized + realized gain/loss, valued against the current
  spot price. Never stored.
- **Holdings** — `totalTroyOz` held and `averageCostPerTroyOz`, replayed
  forward over the ledger. See `lib/calc/holdings.ts`.
- **Weighted-average cost, not FIFO** — a sell reduces quantity and leaves
  the average cost per unit unchanged; proceeds don't touch the basis of
  what remains. Worked example: hold 10 chi at $300 average cost, sell 3,
  still hold 7 chi at $300 average cost. There is no per-lot / FIFO cost
  basis anywhere.
- **Snapshot** — one row in `price_snapshots`: a spot price (USD per troy
  ounce) with a capture timestamp. Append-only, shared across all users,
  written on dashboard load — no cron.
- **The price layer** — `lib/price/`. The only part of the app that talks
  to an external price provider. API keys are read only on the server.

## Invariants

1. **Derived, never stored.** Holdings, average cost, and gain/loss are
   recomputed from the ledger on every load, never persisted.
2. **One canonical price unit.** Prices are stored as USD per troy ounce;
   every other unit or currency is a display-time conversion in `lib/calc`.
3. **No floating point for money or quantities.** Decimal arithmetic
   throughout; every money/quantity DB column is `numeric`.
4. **KHR is skipped, not converted.** USD-denominated aggregates exclude
   KHR rows entirely rather than converting them. `classifyEntry` names
   this rule; per-row valuation blanks every USD figure for a KHR row.
5. **Gain/loss is against spot, not a retail premium.** The UI carries a
   disclaimer that local shop prices won't match; the math does not adjust.
6. **Server-owned identity.** Every query for a user's data is scoped to
   their Clerk session. A user id from the request is never trusted.
7. **The price layer is the only outbound.** Nothing else calls a provider.
8. **Always a price.** On total provider failure `getPrice()` falls back to
   the last cached snapshot; it only throws when there is no cache at all.
9. **The database arbitrates concurrency.** Rate-limit counters and the
   conditional snapshot insert use atomic Postgres upserts, not
   check-then-write in JS.
10. **No hardcoded hex.** UI colors come from CSS tokens (see `DESIGN.md`).

## Replay ordering

`computeHoldings` and `computeRealized` walk a running weighted average
**forward in time**. The stored/displayed ledger is newest-first, so it
must be sorted oldest-first (`toChronological`) before replay, or a sell
draws down an empty position at zero cost basis. `totalTroyOz` survives an
unsorted list (add/subtract commute); `averageCostPerTroyOz` does not.

## Price freshness

The derived view of a snapshot's age (`lib/price/freshness.ts`):

- **isStale** — older than `PRICE_STALENESS_MS` (30 min). The dashboard
  shows a stale treatment; `getPrice()` tries the provider list again. True
  at exactly the boundary — refetching then is the safe direction.
- **cooldownActive** — newest snapshot is younger than
  `MANUAL_REFRESH_COOLDOWN_MS` (5 min); a manual refresh now would be a
  redundant provider call.
- **cooldownEndsAt** — epoch ms when the cooldown lifts; non-null exactly
  when `cooldownActive`. The dashboard passes it to the refresh button; the
  route turns it into a `Retry-After` header.

## Market hours

Spot gold (XAU/USD) trades Sunday 22:00 UTC through Friday 21:00 UTC.
`isMarketOpen()` uses fixed UTC boundaries and deliberately does not track
US daylight-saving — worst case it reads one hour conservative in northern
winter. When closed, `getPrice()` serves any cached snapshot as-is however
stale (no provider request is spent on a weekend) and the UI switches to a
"market closed" treatment.

## Manual refresh outcome

`requestPriceRefresh()` (`lib/price/requestPriceRefresh.ts`) owns the whole
client-side conversation with `POST /api/price/refresh` and returns one of
four outcomes by `kind`: `refreshed`, `cooldown` (429, carries the deadline
as a `Retry-After` header in seconds), `error` (route-level failure), and
`offline` (dropped connection). No React in the module — the caller owns
all UI state, timers, and copy.

## Rate limiting

Transaction-mutating routes (`POST /api/transactions`, `PATCH`/`DELETE
/api/transactions/[id]`, bulk) are hard-blocked (429) at 20 requests per
5-minute window, keyed on Clerk `user_id`. Public signup means these are
exposed to strangers, not just the developer. CSV import is capped at 200
rows per file, enforced server-side and mirrored in the import dialog.
