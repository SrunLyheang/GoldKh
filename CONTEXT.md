# Domain glossary

Ubiquitous language for GoldKh. One term per entry; the codebase should
use these words and mean these things.

## price snapshot

One row in `price_snapshots`: a captured USD-per-troy-ounce gold price, the
provider that served it, whether a user's manual refresh triggered it
(`is_manual`), and when it was captured. Append-only, shared across all
users, owned by no one. Every read and write goes through
`lib/db/queries/priceSnapshots.ts` — no other module touches the table.

## price freshness

The derived view of a price snapshot's age — never stored, computed from
`captured_at` at read time by `priceFreshness()` in `lib/price/freshness.ts`.
It answers two questions with one value object:

- **stale** — the newest snapshot is at least `PRICE_STALENESS_MS` (30 min)
  old, so the dashboard shows a stale treatment and `getPrice()` should try
  the provider list again.
- **cooldown** — the newest snapshot (however it was captured) is younger
  than `MANUAL_REFRESH_COOLDOWN_MS` (5 min), so a manual refresh right now
  would be a redundant provider call. `cooldownEndsAt` is the epoch ms when
  that lifts; the dashboard hands it to the refresh button, the refresh
  route turns it into a `Retry-After` header.

Every call site that used to re-run `Date.now() - capturedAt` against one of
the staleness constants reads a field off this instead.

## manual refresh outcome

The result of one `POST /api/price/refresh` attempt from the client, as
classified by `requestPriceRefresh()` in `lib/price/requestPriceRefresh.ts`.
Exactly one of four:

- **refreshed** — a new snapshot was captured; carries `cooldownEndsAt`
  (epoch ms, or null) from the success payload.
- **cooldown** — the shared 5-minute cooldown was still active (HTTP 429);
  carries an absolute `cooldownEndsAt` derived from the `Retry-After`
  header, plus the server's message.
- **unreachable** — the fetch itself threw (offline, DNS, connection
  dropped); nothing was sent or is known.
- **failed** — the route returned a non-429 error (e.g. the provider was
  down); carries the server's message when there is one.

The refresh button switches on this and owns all of the resulting UI state
and copy; the module owns the wire contract and nothing else.

## transaction ownership

A `transactions` row belongs to exactly one user — the Clerk session id in
its `user_id` column, set server-side on insert and never accepted from the
client (invariant 2). Every read and mutation is scoped by that id in the
SQL `WHERE`, so a non-owner cannot see or change a row even by guessing its
id.

`PATCH` / `DELETE /api/transactions/[id]` distinguish two miss cases:

- **forbidden** (HTTP 403) — the row exists but under another user.
- **not_found** (HTTP 404) — no row has that id.

The 403 deliberately discloses that an id exists. That is an accepted
trade-off: ids are random UUIDv4, so the disclosure buys an attacker
nothing, and callers get an honest status. A client edit/delete flow must
therefore treat 403 the same as 404 for "this transaction is not yours to
touch" — it is not an auth/session problem and should not trigger a
re-login.

## ledger entry

The calc layer's view of one transaction: `type` (buy/sell), `quantity`,
`unit`, `pricePerUnit`, `currency` — no id, date, or notes. Defined once
as `LedgerEntry` in `lib/calc/ledgerEntry.ts` (with `LedgerEntryWithId`
for callers that need to exclude a row by id). Both `computeHoldings`
(aggregate) and `computeRowValuation` (per-row) take this exact shape.

`classifyEntry()` in the same module names the one axis the two valuation
rules share — **non-usd** (KHR, conversion deferred), **sale** (a sell,
no ongoing position to value), **open-buy** (a USD buy, the only kind
that adds to the position). Each rule acts on the answer differently; the
compute functions stay separate.
