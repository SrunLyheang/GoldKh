# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Core dashboard implemented end to end (steps 1-8 of the
  previous "Next Up" list) and verified against the real Neon
  DB and goldapi.io. Edit/delete transaction routes and the
  price-history chart are the remaining named-but-unbuilt
  features.

## Current Goal

- User-facing next step: sign in and use the dashboard to
  confirm the UI matches expectations. Implementation-side next
  step: edit/delete transaction routes (project-overview.md
  lists these as in-scope but they were out of this session's
  approved plan).

## Completed

- Project scaffold: Next.js + TypeScript (App Router, strict TS),
  Tailwind, shadcn/ui, Clerk, `@neondatabase/serverless`, Drizzle
  (ORM only, empty schema), Zod, Geist Sans/Mono, Vault design
  tokens in `app/globals.css`. Auth gate at the repo root — written
  as `proxy.ts`, not `middleware.ts`: this Next.js version (16.3.2)
  deprecated the `middleware` file convention in favor of `proxy`,
  per `node_modules/next/dist/docs/.../file-conventions/proxy.md`.
  `clerkMiddleware` deny-by-default, empty route matcher (nothing
  public yet). Folder structure (`lib/db/`, `lib/price/`,
  `lib/price/providers/`, `lib/calc/`) with one-line `README.md`
  stubs quoting architecture.md's System Boundaries. Empty
  `lib/db/schema.ts`, `drizzle.config.ts` reading `DATABASE_URL`,
  `.env.example` (no real values) with a `.gitignore` negation so
  it can be committed. `npm run build` passes clean, no warnings.
  Nothing committed to git yet.
- Architecture defined and reviewed.
- Price fetching strategy decided (lazy refresh over cron).
- Cache shape decided (append-only history over single
  overwritten row).
- Encryption question resolved.
- Unit conversion factors, response envelope shape, and validation
  library decided (see Architecture Decisions).

## In Progress

- `lib/constants/units.ts` discrepancy from prior sessions —
  resolved. `CHI_PER_TROY_OZ` and `DAMLUNG_PER_TROY_OZ` were
  actually present on disk (the "gone" note above was stale);
  only the verification comment on `GRAMS_PER_CHI` was missing,
  now restored.

## Next Up

Completed in this and the prior session, in order: `price_snapshots`
table + migration, `lib/price/providers/goldapi.ts`, `getPrice()`
with the conditional-insert concurrency guard, `transactions` table
+ migration, `app/api/transactions/route.ts` (GET/POST,
session-scoped), `lib/calc/` (unit conversion, weighted average
cost, gain/loss), the full dashboard UI, a damlung-headline hero
price, a Recharts price-history chart with a break-even reference
line, edit-transaction (`PATCH /api/transactions/[id]`, shared
`TransactionDialog`), a consolidated row-actions "⋯" menu
(Edit/Delete), optimistic add (mirroring the existing optimistic
delete), trimmed-trailing-zero quantity display, a padded
price-chart Y-axis, and removal of the sidebar's "History" nav
item. Remaining, not started:

1. Rate limiting on the transaction-mutating routes — see below.
2. Clerk `user.deleted` webhook.
3. Pagination or an alternate treatment for transaction lists
   long enough to make the `max-h-80` scroll container feel
   cramped — no user has enough rows yet to know if scroll-only
   is sufficient.
4. Backfilling the price-history chart's gaps, if they turn out
   to matter — see the Architecture Decisions entry on the chart.
5. A real, separate History page/route. The sidebar's "History"
   link was removed this session (it only pointed at
   `/dashboard#history`, an anchor on the same page, not a real
   route) — add a genuine nav item back if/when history becomes
   its own page. Until then, the transaction table lives inline
   on `/dashboard` and that's the only place to see it.

## Open Questions

- Clerk `user.deleted` webhook — a deleted user currently leaves
  orphaned transaction rows. Not urgent, but unhandled.
- Rate limiting — not yet designed. If implemented, key on Clerk
  `user_id`, not IP (every route is already authenticated). Watch
  for the serverless trap: an in-memory `Map` counter works
  locally and silently enforces nothing in production, since each
  invocation may be a fresh instance — shared state (database or
  external store) is required. `POST /api/transactions` is now a
  live public mutating route with no rate limit — should be
  resolved soon.
- Live 24h price % change was described in `ui-context.md`'s hero
  card layout but not implemented — `price_snapshots` doesn't
  currently support looking up "the snapshot from ~24h ago"
  efficiently, and inventing a number would violate
  ai-workflow-rules.md's "don't invent product behavior" rule.
  The hero card renders without it. Resolve if this is wanted.

## Architecture Decisions

- **Project name: GoldKh.**

- **Retail-vs-spot premium: resolved, no math change.** Gain/loss
  stays computed as the user's recorded purchase price against the
  current goldapi.io spot price — unchanged from what was already
  specced. This was never a calculation question, just an unclosed
  one. A one-line disclaimer near the price header (see
  `ui-context.md`) notes that local Cambodian gold shops price
  above spot, so a position may show as a "loss" against spot that
  is really dealer premium, not an actual loss. Exact disclaimer
  copy is still open — a UI copy detail, not a blocked decision.
  Further research into actual Cambodian shop premiums may later
  refine that copy or motivate a configurable premium %, but
  nothing is currently blocked on it.

- **No field-level encryption on holdings.** Chosen because the
  cost basis calculation needs to aggregate quantity and price in
  SQL, which encrypted columns make impossible, and because
  transport encryption plus provider disk encryption already
  cover the realistic threat. The actual risk in this system is
  authorization, not confidentiality at rest.

- **User ID always from the server-side Clerk session.** Reading
  it from a request body or URL parameter would let any
  authenticated user retrieve another user's holdings by
  changing an ID. This is the single most important rule in the
  codebase.

- **Lazy refresh instead of a cron job.** Vercel's free tier only
  offers daily cron invocations, so a real five-minute schedule
  would require either paying or running an external pinger — a
  second system that can fail silently. Lazy keeps everything
  inside the app. The cost is that one user every five minutes
  absorbs the fetch latency, which is acceptable at this scale.

- **Append-only price cache instead of a single overwritten
  row.** A price chart is close to certain to be wanted later,
  and free gold APIs do not offer backfill — so overwriting
  discards history that cannot be recovered. At a five-minute
  cadence this is roughly 100k rows a year, which is negligible
  for Postgres.

- **Prices stored as USD per troy ounce only.** Storing
  pre-converted values means a wrong conversion factor corrupts
  every historical row irreversibly. Constants applied at render
  are cheap to correct.

- **Holdings derived, never stored.** A mutable holdings row
  alongside a transaction ledger will drift out of sync, and
  when it does there is no way to tell which one is correct.

- **KHR deferred entirely.** The price layer handles one kind of
  value. Conversion to riel will be added later as a display
  concern, not a second cached price.

- **Weighted average cost, not FIFO.** Matches how the user
  actually thinks about the position — total spent against
  current value.

- **Concurrency guard: conditional insert, not an advisory lock.**
  Simpler and has no transaction-boundary footgun — correctness
  doesn't depend on remembering to wrap acquire, check, insert,
  and commit in one `BEGIN...COMMIT`. Reads directly off
  `code-standards.md`'s "let the database arbitrate concurrency"
  line. `pg_advisory_xact_lock` would also work under pooling and
  was rejected for the transaction-boundary requirement, not for
  correctness — see the Neon decision below; the two rest on each
  other.

- **Database host: Neon, over Supabase.** Scale-to-zero matches
  the lazy-refresh price layer — compute runs only when a request
  is actually served, and nothing is scheduled. Supabase's free
  tier pauses a project after 7 days of inactivity, which would
  need a scheduled pinger to keep it alive, reintroducing exactly
  the external cron dependency lazy refresh was chosen to avoid.
  Secondary reason: Supabase ships its own auth, and this project
  is already on Clerk. Neon's pooled endpoint runs pgbouncer in
  transaction mode — that is what makes the conditional insert
  above the right concurrency guard, and what rules out
  session-scoped advisory locks specifically. These two decisions
  rest on each other; don't revisit one without the other.

- **ORM: Drizzle, over Prisma.** Drizzle returns `numeric` columns
  as strings by default, so there's no silent path from Postgres
  `numeric` to a lossy JS `number` — matches this project's
  no-float invariant. Its query shape expresses the conditional
  insert above directly, without dropping to raw SQL. Prisma's
  `Decimal` is a real wrapper, not a defect — the risk is silent
  serialization to `number` at the client boundary, a regression
  risk over time rather than something that fails immediately.

- **Visual design confirmed: Vault.** Dark, warm-toned palette
  with a single gold accent, chosen to suit a dense financial
  dashboard — one accent color carrying every interactive element
  keeps a numbers-heavy screen legible instead of competing for
  attention.

- **Staleness threshold: 5 minutes.** Recorded as a per-kind
  constant in `lib/constants/` rather than a literal inside
  `getPrice()`, so it has one home if it needs to change.

- **Transactions include a `currency` column.** Users may pay in
  KHR at a local shop even though prices are tracked in USD. Cheap
  to include at table-design time, expensive to retrofit into a
  ledger later.

- **Unit conversion factors: `GRAMS_PER_CHI = 3.75`,
  `GRAMS_PER_TROY_OZ = 31.1034768`, `CHI_PER_DAMLUNG = 10`,
  everything else derived.** Only these three are hardcoded, in
  `lib/constants/units.ts`; chi-per-ounce and damlung-per-ounce are
  computed from them rather than duplicated as separate constants,
  so the numbers can't drift apart. `GRAMS_PER_CHI` is commonly
  cited for Cambodian gold-market convention (matching the
  Vietnamese "chỉ") but hasn't been checked against a live
  Cambodian shop or exchange quote — flagged in a comment at the
  source rather than assumed correct.

- **Response envelope: `{ data: T } | { error: { code: string;
  message: string } }`, every route, no exceptions.** One shape to
  check against in review instead of "roughly consistent." Written
  into `code-standards.md`'s API Routes section as the literal
  type.

- **Validation library: Zod.** Named explicitly in
  `code-standards.md` everywhere "validate input" previously left
  the tool unstated — request bodies and price-provider responses
  alike.

- **Money/quantity arithmetic: `decimal.js`, not bare JS
  `number`.** New dependency, zero sub-dependencies. Drizzle
  already returns `numeric` columns as strings to avoid a lossy
  string→float conversion at the DB boundary; `decimal.js` closes
  the equivalent gap in `lib/calc` and `lib/price`, so no money
  math anywhere in the app touches a float. All `lib/calc`
  functions take and return numeric strings, never `number`.

- **Stale-price visual treatment: muted dot + "Stale" label, not
  amber or red.** Resolves the previously-open `ui-context.md`
  question. Uses `--muted-foreground` instead of a new token — a
  stale price isn't an error state, so it shouldn't reach for
  `--destructive`, and doesn't carry gain/loss meaning, so it
  shouldn't reach for the gold `--primary` accent either.

- **`getPrice()`'s concurrency guard implemented as a raw
  `INSERT ... SELECT ... WHERE NOT EXISTS`,** not a
  query-builder call — Drizzle's builder doesn't express a
  conditional insert directly. The 5-minute interval in the SQL
  literal must be kept in sync with `PRICE_STALENESS_MS` by hand;
  SQL can't reference the JS constant.

- **`getPrice()` and the dashboard price call are unit-tested via
  dependency injection (`GetPriceDeps`), not by mocking
  Drizzle's chained query builder.** `getPrice(deps?)` defaults to
  real DB/provider calls in production and takes overrides in
  tests — cheaper to write and read than mocking
  `.select().from().where().orderBy().limit()` chains.

- **Test framework: Vitest, `environment: "node"`, no
  React-rendering tests this session.** Coverage focuses on
  `lib/calc` (pure, no mocks), `lib/price` (mocked `fetch`/DB via
  dependency injection), and the transactions API route (mocked
  Clerk `auth()` + DB). Component/RTL tests were explicitly
  scoped out to keep the session focused on the logic
  code-standards.md calls correctness-critical; add them later if
  UI regressions become a problem.

- **Binance dropped as a price provider.** User decision — not a
  technical finding. `PROVIDERS` in `lib/price/getPrice.ts` holds
  one entry (`fetchGoldapiPrice`) but is structured as an array so
  a second provider can be added without changing the rotation
  logic, in case a different provider is chosen later.

- **Hero headline price is per damlung, not per troy oz.** User
  decision — damlung is the unit they think in day to day; oz and
  chi moved to the secondary row. `HeroPriceCard` now takes a
  `pricePerDamlung` prop.

- **Price-history chart: shipped using `price_snapshots` as-is,
  not blocked on a backfill mechanism.** Resolves the previously
  "undecided-and-blocked" open question. The chart accepts sparse,
  traffic-clustered points rather than waiting on a separate
  regularly-spaced history table — the user asked for a chart now
  and this app's own snapshot history (accumulating since this
  session) is real data, even if less complete than the old
  single-user app's manually-seeded `SEED_HISTORY`. Revisit if the
  gaps turn out to matter in practice.

- **Chart library: Recharts,** user's explicit choice over a
  dependency-free custom SVG line (which was the recommendation).
  New dependency (`recharts`). `lib/calc/priceHistory.ts` keeps the
  data shaping (troy-oz → damlung conversion, one function,
  tested) separate from the `"use client"` chart component that
  renders it, per code-standards.md's I/O-vs-calculation split.

- **`minimalist-ui` skill applied for principles, not its literal
  palette.** The skill's light off-white/pastel/serif system would
  break `ui-context.md`'s dark-only Vault theme and code-standards's
  "no hardcoded hex, use the existing tokens" rule. Applied instead:
  single-column layout, generous spacing, restrained borders, a
  segmented Buy/Sell toggle instead of a dropdown — all within the
  existing CSS custom properties.

- **Transaction delete: two-click inline confirm, not a modal.**
  Click the trash icon, the cell swaps to Delete/Cancel buttons.
  Chosen over a confirm() dialog or a separate modal for the "easier
  way to remove a misclick" ask — stays in place, no extra
  navigation. `DELETE /api/transactions/[id]` enforces ownership the
  same way `POST` enforces it on create — verified against the real
  DB: a wrong-owner delete no-ops, the real owner's succeeds.

- **Delete is optimistic, tracked as a `removedIds` Set, not a
  mirrored copy of the transactions array.** Confirming delete
  drops the row's id into `removedIds` and `rows` is derived as
  `transactions.filter(id not in removedIds)` every render — no
  `useEffect` syncing state from props (React's purity/set-state-in-
  effect lint rule flags that pattern; it also just isn't needed
  here). A failed request removes the id back out of the set,
  which "puts the row back" for free since it's filtered from the
  same source array. A failed request also shows a dismissible
  inline error banner (auto-clears after 5s) with the server's
  error message. A successful delete calls `router.refresh()` — the
  row is already gone from the UI by then; this is only to
  resync holdings/gain-loss/the chart, which are computed
  server-side from the full transaction list.

- **Transaction table redesigned as a real `<table>`, matching the
  user's earlier single-user app's columns** (Date, Quantity, Paid,
  /damlung, Current Value, P&L). The Current Value/P&L columns are
  a new per-row calculation (`lib/calc/transactionRow.ts`) — read
  its header comment before changing it: this is deliberately kept
  separate from and never fed into the aggregate weighted-average
  holdings calc, to stay inside project-overview.md's "no per-lot
  cost basis" scope rule. Sell rows and non-USD rows show "—" for
  Current Value/P&L (no ongoing position to value; KHR conversion
  is deferred entirely).

- **Dashboard auto-refreshes every 60s via `router.refresh()`**
  (`components/dashboard/auto-refresh.tsx`), not a live WebSocket
  or SWR poll. `getPrice()`'s own 5-minute staleness check still
  gates whether this actually hits goldapi.io — most polls just
  re-read the cache. User asked for the dashboard to "automatically
  upgrade every time the API refreshes."

- **Edit transaction: `PATCH /api/transactions/[id]`, full replace
  against the same Zod schema as `POST`.** Not a partial-field
  patch — every field is required in the request body, matching
  `updateOwnedTransaction`'s `.set({ ...input, updatedAt: new
  Date() })`. Both routes now import the shared
  `lib/validation/transaction.ts` schema instead of each declaring
  their own, so create and edit can never validate against
  different rules.

- **`AddTransactionDialog` merged into a single `TransactionDialog`**
  (`components/dashboard/transaction-dialog.tsx`), branching on
  whether an `EditableTransaction` prop is passed. Add mode owns
  its own trigger button and open state; edit mode is fully
  controlled by the caller (`open`/`onOpenChange`) since it's
  opened from a row's "⋯" menu rather than a dialog-owned button.

- **Row actions consolidated into one "⋯" dropdown menu** (Edit,
  Delete) instead of two bare icons — user-requested cleanup while
  adding edit. Built `components/ui/dropdown-menu.tsx` on
  `@base-ui/react/menu`, mirroring how `dialog.tsx` wraps
  `@base-ui/react/dialog` (no existing shadcn dropdown-menu
  component was present). Delete's confirm mechanics (inline
  Delete/Cancel swap) are unchanged — only its entry point moved
  from a standalone trash icon into the menu.

- **Add is now optimistic too, via a `pendingAdds` array prepended
  to `rows`** — mirrors the existing optimistic-delete `removedIds`
  pattern rather than introducing a different state shape. The
  dialog closes immediately on submit (only when a caller passes
  `onOptimisticAdd`/`onAddSettled` — `EmptyState`'s usage doesn't,
  and keeps the old close-after-success behavior since there's no
  table to add a pending row into on that screen). A pending row
  can't be edited or deleted until the server confirms it (its
  temp id would 404) — shown dimmed with "Saving…" instead of the
  "⋯" menu. `awaitingAddRefresh` (a ref, not state) tracks whether
  the next `transactions` prop update should clear `pendingAdds`,
  so an unrelated delete happening mid-flight doesn't clear a
  still-pending add.

- **Quantity display trims trailing zeros instead of showing the
  DB's fixed `numeric(_, 4)` padding.** `formatQuantity()`
  (`lib/format/money.ts`) already existed for the stat row's
  totals but capped at 2 decimals; raised to 4 (matching the
  column's actual scale) and reused in the transaction table's
  Quantity column and the edit dialog's quantity `defaultValue`.
  "1.0000" now reads "1"; "1.2500" reads "1.25" — nothing is
  rounded away that the user actually entered. The `<input
  type="number">` itself was never the problem (Postgres pads to
  scale on write regardless of what's typed) — this is a
  display-only fix, not a validation change.

- **Price-history chart Y-axis is no longer `domain={["auto",
  "auto"]}`.** Recharts' auto-domain hugged the data so tightly
  that real price movement read as a flat line. Replaced with a
  domain function padding both ends by 15% of the current
  min/max range (falling back to 2% of the value itself when the
  range is ~0 — e.g. only one distinct snapshot so far, to avoid
  a zero-width or negative padded range).

- **Optimistic state (`pendingAdds`/`removedIds`) lifted from
  `TransactionHistory` into a new `components/dashboard/
  dashboard-content.tsx` client wrapper.** User reported that
  adding a transaction updated the table row instantly but the
  stat row / gain-loss / break-even line still waited on
  `router.refresh()` — because those were computed server-side in
  `page.tsx` from the un-optimistic `transactions` prop.
  `DashboardContent` now owns the merged `rows` list and recomputes
  `computeHoldings`/`computeGainLoss` client-side from it (both
  already pure decimal.js functions with no server-only imports, so
  reusing them client-side introduced no new logic — same functions
  `page.tsx` used server-side for the initial render). `page.tsx`
  now only fetches data and computes `chartPoints` (unaffected by
  transaction changes); `TransactionHistory` became a controlled/
  presentational component (`rows`, `error`, and handlers all
  passed in as props instead of owned internally); `EmptyState`
  gained the same `onOptimisticAdd`/`onAddSettled` props so the
  very first transaction flips it over to the real dashboard
  instantly instead of waiting on a refresh.

- **Date entry is a hand-rolled calendar popover, not a new
  dependency.** Built `components/ui/popover.tsx` (wraps
  `@base-ui/react/popover`, mirroring `dialog.tsx`'s wrapper
  pattern) and `components/ui/calendar.tsx` (a plain month grid,
  no react-day-picker or similar — the project has stayed
  dependency-light apart from recharts, an explicit prior user
  choice). `components/ui/date-field.tsx` combines them behind a
  hidden `<input type="hidden">` so the existing `formData.get(
  "transactionDate")` read in `transaction-dialog.tsx` needed no
  change. Defaults to today (not empty) since a hidden input's
  `required` isn't enforced by the browser.

- **Quantity/price number inputs use `step="any"`, not
  `step="0.0001"`.** The literal step value made the browser's
  native spinner buttons increment by 0.0001 per click (typing "1"
  then clicking once produced "1.0001") — user-reported. `"any"`
  removes the step constraint entirely: the spinner falls back to
  incrementing by whole numbers, and manually typed decimals
  (chi/damlung quantities, KHR prices) remain valid without
  triggering native step-mismatch validation.

- **Refresh button keeps the 5-minute price cache, adds a
  "Refreshed" confirmation instead.** User asked what the button's
  role was — it already forced a real server round-trip
  (`router.refresh()`), but `getPrice()`'s 5-minute staleness gate
  means most clicks just re-render identical numbers, reading as
  broken. Chose visible feedback over bypassing the cache (offered
  as the alternative) to avoid burning extra goldapi.io calls.

- **Sidebar's "History" nav item removed, not repointed.** It
  only ever linked to `/dashboard#history`, an anchor on the same
  page — never a distinct route — so it was misleading rather than
  functional. User confirmed "history" and "dashboard" are meant
  to be the same page; the transaction table itself was NOT
  removed, only the redundant nav entry pointing at an anchor on
  the page it's already on. A real History nav item can be added
  back if/when it becomes an actual separate page.

## Known Constraints

- Neon cold start of roughly 500ms–2s on the first connection
  after the database has scaled to zero. Lands on whoever loads
  the dashboard first after a quiet period, and can stack with a
  stale-cache price fetch on the same request. Expected, not a
  performance bug.
- Neon free tier storage is 0.5 GB per project, and the limit is a
  hard cutoff, not a throttle — the database suspends when hit.
  `price_snapshots` at 5-minute intervals is roughly 100k rows a
  year, single-digit megabytes, so this is not a near-term
  concern. Recorded so the wall is known rather than assumed.

## Session Notes

- Clerk sign-in was previously restricted to Google only; user
  reconfigured available sign-in methods directly in the Clerk
  Dashboard (Google + email) and replaced `.env.local` with fresh
  keys. Code side confirmed correct: `ClerkProvider` placement,
  `proxy.ts` middleware, and `/sign-in` `/sign-up` routes were
  already right — the one code fix needed was adding
  `'/__clerk/:path*'` to `proxy.ts`'s `config.matcher` (was
  missing, required by this Next.js version's Clerk auto-proxy).
  Verified in-browser: `/sign-in` now renders both "Continue with
  Google" and an email field.
- Applied `@clerk/ui` shadcn theme (`app/layout.tsx`
  `ClerkProvider appearance={{ theme: shadcn }}`) plus a
  `localization={{ signIn: { start: { title: "Sign in" } } }}`
  override — components now render dark, matching the Vault
  palette, and the sign-in heading reads "Sign in" instead of
  "Sign in to My Application". Added
  `@import "@clerk/ui/themes/shadcn.css";` to `globals.css`.
  `@clerk/ui` install initially failed (`EEXIST`/`EACCES` on a
  stray root-owned dir under `~/.npm/_cacache`, likely left by a
  prior `sudo npm` run) — worked around with `--cache <scratch
  dir>` rather than touching the root-owned cache; that stray
  directory is still there and will keep breaking installs that
  hit its cache keys until someone with sudo cleans it up
  (`sudo chown -R $(whoami) ~/.npm` or `sudo rm -rf
  ~/.npm/_cacache`).
- User reports GitHub/Apple/Facebook OAuth (added in the Clerk
  Dashboard) still don't appear on `/sign-in`, only Google + email
  do. Unresolved — `clerk auth login` timed out twice waiting on
  the browser flow, so the instance config couldn't be inspected
  via CLI. Likely causes, unverified: those OAuth connections
  toggled on in the dashboard without real client ID/secret filled
  in (Clerk won't activate a strategy that isn't fully configured),
  or the dashboard edits landed on a different
  instance/environment than the `pk_test_`/`sk_test_` keys
  currently in `.env.local`. Next step: user completes `clerk auth
  login`, then `clerk link --app app_3IPmnrB8WJNqRcixFjjf3stYS87`
  and `clerk config pull` to inspect the `social` config directly.
- The architecture diagram to work from has the browser and
  `clerkMiddleware` above a dashed Next.js server boundary
  containing route handlers and `getPrice()`, with external
  providers below `getPrice()` and Postgres holding
  `transactions` and `price_snapshots`.
- Providers to use: goldapi.io only. Binance PAXG/USDT was
  considered but the user has decided not to use it — dropped
  from project-overview.md and .env.example. goldapi.io has
  been used before on the earlier single-user version.
- The price cache read path — `price_snapshots` back up to
  `getPrice()` — is deliberately absent from the diagram to keep
  it readable. It exists in the code.
- A provider returning HTTP 200 with an error body is the
  expected failure mode to guard against in the rotation logic.
