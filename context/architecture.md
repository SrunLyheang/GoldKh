# Architecture Context

## Stack

| Layer     | Technology                                     | Role                                                          |
| --------- | ----------------------------------------------- | --------------------------------------------------------------- |
| Framework | Next.js + TypeScript                           | Single repo serving both UI and server logic                  |
| UI        | Tailwind + shadcn/ui                           | Component styling and primitives                              |
| Auth      | Clerk                                           | Sign-in, session, and the source of truth for user identity   |
| Database  | PostgreSQL on Neon (serverless, scale-to-zero) | Transactions ledger and price cache                            |
| Driver    | `@neondatabase/serverless`                     | Pooled connection string only — see invariant 9                |
| ORM       | Drizzle                                         | Returns `numeric` as strings; no ORM-level float coercion     |
| Price     | goldapi.io, Binance PAXG                       | External spot price providers, contacted only on cache miss   |

## System Boundaries

- `app/` — Routes, pages, and route handlers. Owns request
  parsing, auth enforcement, and response shaping. Contains no
  business logic and never talks to an external API directly.
- `lib/db/` — Schema, migrations, and every query in the
  application. Owns the fact that the database is Postgres;
  nothing outside this folder writes SQL.
- `lib/price/` — The entire price layer. Owns provider modules,
  provider rotation, staleness checking, and cache reads and
  writes. Exposes one function to the rest of the app.
- `lib/calc/` — Pure functions for cost basis, holdings totals,
  gain/loss, and unit conversion. No I/O, no database access, no
  awaits. This is the folder that should be trivially testable.
- `components/` — Presentational and interactive UI. Receives
  computed values as props; performs no financial calculation
  of its own.

## Storage Model

- **PostgreSQL — `transactions`**: The transaction ledger. One row
  per buy or sell, recording quantity, unit, price, and date,
  owned by exactly one user. Holdings and average cost are
  derived from this table at read time and are never stored.
- **PostgreSQL — `price_snapshots`**: Append-only price cache.
  One row per captured price, storing the value, the provider
  that served it, and the capture timestamp. Shared across all
  users; not owned by anyone.
- **No blob or file storage.** Nothing this application stores
  is large enough to justify it.

## Auth and Access Model

- Every user signs in via Clerk. There is no anonymous or guest
  mode.
- `clerkMiddleware` denies by default: routes are private unless
  explicitly listed as public. The middleware is a convenience,
  not the boundary — route handlers independently verify the
  session.
- Every transaction row is owned by exactly one user, keyed on
  the Clerk user ID.
- The user ID used in any query is read from the server-side
  Clerk session. It is never taken from a request body, query
  string, URL parameter, or header.
- Price data is not user-owned and is readable by any
  authenticated user.

## Invariants

1. No module outside `lib/price/` contacts an external price
   provider. Everything else calls the single exported price
   function.
2. Every query touching user-owned data filters by a user ID
   obtained from the server-side session. A client-supplied
   user ID is never trusted, even for a read.
3. Holdings, average cost, and gain/loss are always computed from
   `transactions` at read time and never stored as a separate
   mutable row that could drift. Editing a transaction is a normal
   `UPDATE` — the invariant is about derived values, not about the
   row itself being immutable.
4. Prices are stored as USD per troy ounce and nothing else.
   Conversion to chi, damlung, or any currency happens at
   display time, using constants applied at render.
5. Money and quantity columns use `numeric`. Floating point is
   never used for a price, a quantity, or anything derived from
   them.
6. Any code path that spends external API quota is protected by
   a shared secret and cannot be triggered by an unauthenticated
   request.
7. Provider responses are normalized into a single internal
   shape at the boundary of `lib/price/`. Provider-specific
   response shapes never leak upward.
8. External API keys are read only in server-side code and are
   never referenced in a client component.
9. The application connects to Neon via the pooled connection
   string, never the direct one. Serverless functions open a
   connection per invocation; direct connections exhaust quickly
   under that pattern.
