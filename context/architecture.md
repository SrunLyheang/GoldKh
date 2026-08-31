# Architecture Context

## Stack

| Layer     | Technology                                     | Role                                                        |
| --------- | ---------------------------------------------- | ----------------------------------------------------------- |
| Framework | Next.js + TypeScript                           | Single repo serving both UI and server logic                |
| UI        | Tailwind + shadcn/ui                           | Component styling and primitives                            |
| Auth      | Clerk                                          | Sign-in, session, and the source of truth for user identity |
| Database  | PostgreSQL on Neon (serverless, scale-to-zero) | Transactions ledger and price cache                         |
| Driver    | `@neondatabase/serverless`                     | Pooled connection string only — see invariant 9             |
| ORM       | Drizzle                                        | Returns `numeric` as strings; no ORM-level float coercion   |
| Price     | goldapi.io, Binance PAXG                       | External spot price providers, contacted only on cache miss |
| Deploy    | Vercel                                         | Hosting platform — reference Next.js host, pairs with Neon  |
| Errors    | Sentry (`@sentry/nextjs`)                      | Error tracking, client and server                           |

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
- **Charts read the snapshot table at request time; no cron.**
  The dashboard price chart and `/dashboard/price`
  (`DetailedChart`), and the Insights portfolio-value chart
  (`buildPortfolioSeries` replays the ledger against each stored
  snapshot), are built from `listRecentPriceSnapshots()` on each
  load — same lazy model as the hero price. There is no
  scheduled job writing denser history and no external backfill,
  so a preset like `3M` is disabled when it would exceed the
  oldest stored snapshot; it shows an informational toast instead
  of silently clamping to the oldest snapshot. This keeps the
  goldapi.io free-tier quota untouched by charting unless the
  chart contract is intentionally changed to restore clamping. If
  snapshot sparsity ever makes a chart useless, the follow-up is a
  `portfolio_snapshots` table written on dashboard load (still no
  cron) — see progress-tracker.md Open Questions.
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
- Transaction mutation routes, all `withAuthAndRateLimit` +
  `assertSameOrigin`, session-scoped, `{ data } | { error }`:
  `POST /api/transactions` (create), `PATCH|DELETE
/api/transactions/[id]` (owned mutation), `POST
/api/transactions/bulk` (CSV import — one all-or-nothing
  multi-row insert, 200-row cap, one rate-limit token; its
  validation-failure response is the one documented exception to
  the envelope — it adds an `issues` array of `{ index, message }`
  alongside `error` so the import dialog can keep the bad rows),
  `DELETE /api/transactions` (delete all the caller's rows), and
  `DELETE /api/account` (Clerk `users.deleteUser`; DB cleanup via
  the existing `user.deleted` webhook).

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
10. Required environment variables (`DATABASE_URL`,
    `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
    `GOLDAPI_IO_API_KEY`) are validated with Zod in `lib/env.ts`'s
    `validateEnv()`, called once from `proxy.ts`, and fail the
    process at boot if missing or malformed — the same
    validate-at-the-boundary rule `code-standards.md` applies to
    request bodies and price-provider responses, applied to process
    startup. `CLERK_WEBHOOK_SIGNING_SECRET` is validated for shape
    when present but not required to boot: it gates one route
    (`app/api/webhooks/clerk/route.ts`), which already verifies it
    lazily via `verifyWebhook()` on actual delivery and returns 400
    on failure — hard-requiring it at boot would block the entire
    app over that one route's secret.

## Deployment and Operations

- **Platform: Vercel.** No direct-connection risk beyond invariant
  9 above — Vercel's serverless functions are exactly the "one
  connection per invocation" pattern the pooled Neon string exists
  for.
- **CI: GitHub Actions**, running `lint` + `test` + `build` on every
  PR into `main`, blocking merge on failure. Mechanically enforces
  the `npm run build` gate `ai-workflow-rules.md` already requires
  before moving to the next unit.
- **Migrations run manually against production** (`drizzle-kit`),
  not as a Vercel build-time hook — a build failure should not be
  able to leave a migration half-applied.
- **First-deploy checklist** (outside this repo, not automatable):
  1. Connect the Vercel project to `SrunLyheang/GoldKh`, auto-deploy
     on push to `main`.
  2. Set production env vars in Vercel's dashboard — `DATABASE_URL`
     (Neon's pooled connection string, invariant 9),
     `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` from
     Clerk's **production** instance (not the dev/test keys used
     locally — Clerk issues separate key pairs per instance),
     `GOLDAPI_IO_API_KEY`, and (once the steps below are done)
     `CLERK_WEBHOOK_SIGNING_SECRET` and `NEXT_PUBLIC_SENTRY_DSN`.
  3. Run `npx drizzle-kit migrate` by hand against the production
     `DATABASE_URL` before or as part of any deploy that changes
     `lib/db/schema.ts` — never automated into the Vercel build.
  4. After the first deploy, register
     `https://<production-domain>/api/webhooks/clerk` in the Clerk
     Dashboard's Webhooks section, subscribed to `user.deleted` —
     the domain isn't known until step 1 has happened once.
  5. Create a Sentry project and add its DSN as
     `NEXT_PUBLIC_SENTRY_DSN` in Vercel. Optionally also add
     `SENTRY_AUTH_TOKEN` and org/project slugs to `next.config.ts`'s
     `withSentryConfig` call to enable source-map upload (skipped
     today — see the comment in `next.config.ts` itself).
- **Error tracking: Sentry**, client and server, via
  `@sentry/nextjs`. Surfaces price-layer and query failures directly
  instead of relying on user reports.
- **Security headers**: a baseline set (`X-Content-Type-Options`,
  `Referrer-Policy`, `frame-ancestors`, HSTS) is set in
  `next.config.ts`'s `headers()`. A full Content-Security-Policy is
  deferred — see `progress-tracker.md`'s Open Questions — pending an
  audit of what Clerk's embedded UI and Recharts actually load and
  execute.
- **Backup policy: Neon free-tier point-in-time recovery, accepted
  as-is.** No custom backup/export job. A deliberate hobby-project
  tradeoff, not an oversight — see `progress-tracker.md`'s
  Architecture Decisions.
