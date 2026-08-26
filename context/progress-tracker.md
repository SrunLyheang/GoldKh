# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Core dashboard implemented end to end and verified against the
  real Neon DB and goldapi.io: transactions CRUD (add/edit/delete,
  all optimistic), holdings/gain-loss calc, price-history chart,
  and Vault visual design. Open public signup confirmed as the
  actual audience (2026-08-26 grilling session), which reprioritized
  the remaining work toward hardening (rate limiting, the
  `user.deleted` webhook, UI test coverage) over new features.

## Current Goal

- Rate limiting on the transaction-mutating routes is implemented —
  the last item of the three from the 2026-08-26 grilling session
  (see Architecture Decisions). Verified (typecheck, full test
  suite, lint, `next build` all clean) but not yet committed. Next:
  UI/component test coverage (item 3), the one remaining priority
  item.

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

Priority order confirmed via a 2026-08-26 grilling session — items
1-3 are the actual next work; 4-5 stay deferred until they cause a
real problem, not on a fixed timeline. (The Refresh-button rework
that briefly sat ahead of this list has shipped — see Architecture
Decisions.)

1. ~~Rate limiting on the transaction-mutating routes.~~ Done — see
   Architecture Decisions.
2. ~~Clerk `user.deleted` webhook.~~ Done — see Architecture
   Decisions.
3. UI/component test coverage (see Architecture Decisions) —
   after 1 and 2, before new features.
4. Pagination or an alternate treatment for transaction lists
   long enough to make the `max-h-80` scroll container feel
   cramped — no user has enough rows yet to know if scroll-only
   is sufficient.
5. Backfilling the price-history chart's gaps, if they turn out
   to matter — see the Architecture Decisions entry on the chart.
6. A real, separate History page/route. The sidebar's "History"
   link was removed this session (it only pointed at
   `/dashboard#history`, an anchor on the same page, not a real
   route) — add a genuine nav item back if/when history becomes
   its own page. Until then, the transaction table lives inline
   on `/dashboard` and that's the only place to see it.

## Open Questions

- **goldapi.io free-tier quota (100 req/month) vs. staleness
  interval.** 30 minutes (see Architecture Decisions) is sized for
  sporadic checking, not a dashboard left open all day continuously —
  revisit if the user's actual usage pattern turns out to burn through
  the quota faster than expected.
- ~~Clerk `user.deleted` webhook~~ — resolved, see Architecture
  Decisions. Requires `CLERK_WEBHOOK_SIGNING_SECRET` (added to
  `.env.example`) and registering the endpoint URL in the Clerk
  Dashboard's Webhooks section, subscribed to `user.deleted`, before
  it does anything in production — not yet done outside this repo.
- Live 24h price % change was described in `ui-context.md`'s hero
  card layout but not implemented — `price_snapshots` doesn't
  currently support looking up "the snapshot from ~24h ago"
  efficiently, and inventing a number would violate
  ai-workflow-rules.md's "don't invent product behavior" rule.
  The hero card renders without it. Resolve if this is wanted.
- **Notes-field content sanitization/injection hardening** — flagged
  by the user as future work, not built. `lib/validation/transaction.ts`'s
  `notes` field is length-capped (500 chars) only, no content
  sanitization. Not a live vulnerability today — React escapes JSX
  text by default and Drizzle parameterizes queries — but worth
  revisiting if notes content is ever rendered via
  `dangerouslySetInnerHTML`, exported, or fed into another system.
- **`computeHoldings`/weighted-average cost mixes KHR `pricePerUnit`
  into the same aggregate as USD, unguarded.** Discovered while
  building mock QA data for the 2026-08-26 responsive pass (a KHR
  buy at a realistic per-chi price skewed average cost and the
  chart's break-even line by roughly 3 orders of magnitude). Per-row
  display (`lib/calc/transactionRow.ts`'s `computeRowValuation`)
  already correctly nulls out Current Value/P&L for non-USD rows,
  but the portfolio-level `computeHoldings`/`computeGainLoss` in
  `lib/calc/holdings.ts` don't appear to exclude non-USD rows the
  same way. Not fixed — out of scope for the responsive/UI task in
  progress and KHR conversion is already documented as deferred
  entirely — but worth a real look before KHR transactions see
  meaningful use, since today a KHR entry silently corrupts the
  portfolio's cost basis rather than being excluded or converted.

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

- **One shared loading component (`components/ui/loading.tsx`):
  `Spinner` (a bordered ring, sizes xs–lg) and `LoadingScreen`
  (centers a large `Spinner` with a label).** Built from existing
  `--border`/`--primary` tokens, no new color. User asked for a
  single component design used everywhere something needs a
  loading state, rather than each spot inventing its own treatment.
  Wired into: the transaction dialog's submit button (`Spinner`
  next to "Saving…", replacing bare disabled text), `RefreshButton`
  (swaps `RefreshCw` for `Spinner` while `isPending` — also let the
  old fixed 600ms fake-spin timeout be deleted in favor of
  `useTransition`'s real `isPending`), and a new
  `app/dashboard/loading.tsx` (Next.js route-level loading UI,
  shown automatically while `page.tsx`'s auth check + `getPrice()`
  + DB queries are in flight — matters most on a cold Neon
  connection). `/` redirects immediately and sign-in/sign-up are
  Clerk-managed, so neither needed one.

- **`TransactionDialog` always shows a full `LoadingScreen` in
  place of the form while `submitting`, for every mode — the
  earlier "gate it on `!isOptimistic`" version (below, corrected)
  meant Add never showed it, since the dialog used to close in the
  same tick it opened. Reverted after the user reported "still no
  loading screen after clicking add transaction."**
  `onOptimisticAdd` still fires immediately so the dashboard
  reflects the new row right away, but the dialog itself no longer
  closes early — it stays open through the request and closes only
  on success (or reverts to the form with an error on failure,
  same as every other path). This also exposed a real bug: the Add
  dialog used to be rendered separately inside both `EmptyState`
  and `TransactionHistory`'s header. The instant the first
  optimistic row landed, `DashboardContent` swapped `EmptyState`
  out for the real table — unmounting whichever dialog instance
  was open mid-request. Fixed by lifting `TransactionDialog` to a
  single shared instance owned by `DashboardContent` (new `addOpen`
  state), with `EmptyState` and `TransactionHistory`'s header
  reduced to trigger-only buttons (`onAddClick`) that open it.
  `TransactionDialog` is now always fully controlled
  (`open`/`onOpenChange` required, no built-in trigger in either
  mode) — the per-row Edit dialog in `RowActions` was already
  controlled correctly and needed no change.

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
  **Superseded** later (see the entry below) once the user reported
  the button as still not doing anything real — visible feedback on
  a no-op round trip wasn't actually enough.

- **Refresh button reworked to bypass the cache for real, gated by
  a 10-minute cooldown — implemented.** `price_snapshots` gained an
  `isManual boolean not null default false` column (migration
  `0001_faulty_sway.sql`, applied to the live Neon DB). New
  `POST /api/price/refresh` route: checks `getLatestManualSnapshot()`
  via `isManualCooldownActive()` (429 `COOLDOWN` if within 10
  minutes), otherwise calls `fetchGoldapiPrice()` directly and
  inserts via the new `insertSnapshot(price, { manual: true })`,
  bypassing `getPrice()`'s 30-minute staleness gate entirely. 502
  `PROVIDER_ERROR` on provider failure. `app/dashboard/page.tsx`
  computes `canManualRefresh` server-side and threads it through
  `DashboardContent` → `HeroPriceCard` → `RefreshButton`, so the
  button starts disabled ("Refreshed recently") instead of letting a
  click fail. One deviation from the original plan: `insertSnapshot`
  is a plain unconditional insert used only by this route, *not*
  wired underneath `insertIfStillStale`'s atomic conditional insert
  as the plan suggested — splitting that single guarded SQL
  statement into a separate check-then-insert would reopen the race
  condition the conditional insert exists to close. Covered by
  `app/api/price/refresh/route.test.ts` (401/429/200/502 cases).

- **Sidebar converted to `fixed` positioning, highest z-index.**
  Per `context/design-specs/01-ui-ux`: the nav bar should be fixed
  height and stack above everything else. `Sidebar`
  (`components/dashboard/sidebar.tsx`) changed from a normal flex
  child to `fixed inset-y-0 left-0 z-50`; `DashboardLayout`
  (`app/dashboard/layout.tsx`) added `ml-59` to `<main>` so content
  no longer sits under the now-fixed sidebar. The `UserButton`
  block was already the last child after `flex-1` on the nav list,
  so it already pins to the bottom of the fixed column — no
  additional change needed for that half of the spec. Landed in
  `4c7f01a` (confirmed via `git status`/`git log` — no longer
  uncommitted, correcting the earlier note).

- **Price staleness raised from 5 minutes to 30 minutes
  (`lib/constants/staleness.ts`).** Per `context/design-specs/02-Table`
  ("the api limit refresh every 5 minute is too much, help me find a
  good number"). User confirmed the goldapi.io plan is the free tier
  (100 requests/month). At 5 minutes, a continuously-open dashboard
  could call the provider up to ~8,640 times/month — far over quota.
  30 minutes cuts that worst case to ~1,440/month and comfortably
  covers realistic sporadic-checking usage (well under 100/month) at
  the cost of the price being up to 30 minutes stale on a cold cache.
  If usage patterns change (e.g. the dashboard is left open all day,
  every day) this may still need raising further — `getPrice()`
  already falls back to the last cached price rather than erroring if
  the quota is exceeded, so hitting the cap degrades gracefully rather
  than breaking the app. The raw SQL literal in
  `insertIfStillStale` (`lib/price/getPrice.ts`) was updated to match
  (`'5 minutes'` → `'30 minutes'`) since SQL can't reference the JS
  constant directly.

- **Price-history chart Y-axis snapped to fixed $100 gridlines
  instead of Recharts' auto-derived ticks.** Per
  `context/design-specs/02-Table` ("make the y price have more
  difference every 100$" — the auto ticks landed on uneven values
  that made real price movement hard to read at a glance). Added
  `computeYAxis()` (`components/dashboard/price-history-chart.tsx`),
  which keeps the existing 15%-padded domain logic but also returns
  an explicit `ticks` array stepped by `$100` and floored/ceiled to
  the nearest hundred, passed to Recharts' `YAxis` via `domain`/
  `ticks` instead of the old inline `domain` function. Chart height
  also raised from `220px` to `h-70` (280px) for more visual room
  between gridlines, applied to both the chart and its "not enough
  history yet" placeholder for consistency.

- **Sidebar's "History" nav item removed, not repointed.** It
  only ever linked to `/dashboard#history`, an anchor on the same
  page — never a distinct route — so it was misleading rather than
  functional. User confirmed "history" and "dashboard" are meant
  to be the same page; the transaction table itself was NOT
  removed, only the redundant nav entry pointing at an anchor on
  the page it's already on. A real History nav item can be added
  back if/when it becomes an actual separate page.

- **Transaction dialog fields lifted from `defaultValue`-based
  uncontrolled inputs to `useState`-controlled state.** Root-cause
  fix for "a failed submit wipes everything you typed" — the
  dialog's `submitting ? LoadingScreen : form` swap was already
  unmounting/remounting the form DOM on every submit, and an
  uncontrolled input remounts from its original default, not from
  what the user typed. `type` was already state (survived this)
  which is what exposed the pattern. Controlled state also enabled,
  in the same change: client-side validation against the existing
  `transactionInputSchema` (per-field, shown once a field is
  touched or submit's been attempted, blocking the `fetch` call
  entirely on failure — no wasted round trip), a live total-cost +
  current-spot-price preview (unit-aware via `priceFromTroyOz`), and
  a sell-exceeds-current-holdings warning. The `<form action={...}>`
  FormData mechanism was replaced with a plain `onSubmit` building
  the payload from state directly — this was never wired to a real
  Next.js server action, just used as a convenient callback shape.

- **Sell-exceeds-holdings: warn, don't hard-block.** User decision.
  `computeHoldings`'s weighted-average model doesn't error on a
  resulting negative balance, the server has no matching rule (a
  client hard-block would be bypassable via direct API call), and a
  single-user personal tracker has legitimate reasons to enter
  transactions out of chronological order (backfilling history,
  fixing an earlier mis-entered buy before this sell). Added
  `TransactionWithId` to `lib/calc/holdings.ts` so the dialog can
  compute holdings excluding the row currently being edited (a
  no-op filter in add-mode) — editing a sell row compares against
  holdings as if that row didn't exist yet, the only comparison
  that's actually meaningful.

- **Success confirmation reuses the existing dismissible-banner
  pattern** (`dashboard-content.tsx`'s `successMessage` state,
  identical 5s-auto-clear `useEffect` already used for `error`) —
  no new Toast/notification component. Styled with the gold
  `--primary` accent, not green: `ui-context.md` reserves green/red
  strictly for buy/sell and gain/loss semantics, and a generic
  "saved" confirmation is decorative, not one of those meanings.

- **KHR and USD-sell "—" cells (Current Value/P&L columns) get
  distinct `title` tooltips** instead of looking identical with no
  explanation — "KHR entries aren't converted to USD yet" vs. "Sell
  rows show proceeds, not an ongoing position." Native `title`
  attribute, no new Tooltip component.

- **Audience: open public signup, not a gated/trusted circle.**
  User decision, surfaced via a grilling session on 2026-08-26.
  GoldKh is meant to let other people track their own gold, not
  just the developer — anyone can create a Clerk account, though
  it isn't being actively promoted yet. This raises the stakes on
  every "acceptable for personal use" tradeoff made earlier
  (rate limiting, the `user.deleted` webhook, UI test coverage)
  since real strangers, not just the developer, can now mutate
  data and see numbers they might act on. "Done" for this project
  means people actually trust and rely on the dashboard, not just
  passing the mechanical Success Criteria in
  `project-overview.md`.

- **Rate limiting: hard block (HTTP 429) once exceeded, keyed on
  Clerk `user_id`.** Resolves the Open Questions entry above.
  Prioritized as the next implementation unit, ahead of the
  `user.deleted` webhook and UI/component tests, because open
  public signup means `POST /api/transactions` is now exposed to
  strangers, not just the developer. Still subject to the
  serverless trap noted in the (now-resolved) open question: an
  in-memory counter enforces nothing across invocations, so the
  limit must be backed by shared state (the database or an
  external store), not a local `Map`.

- **UI/component test coverage: planned, sequenced after rate
  limiting and the `user.deleted` webhook.** Reverses the earlier
  "add later if UI regressions become a problem" framing recorded
  above (see the Vitest entry) — now that wrong numbers could
  plausibly drive a real financial decision for a stranger, not
  just the developer, correctness of the UI wiring around
  `lib/calc`/`lib/price` is worth locking down proactively rather
  than reactively.

- **Unit system stays hardcoded to Cambodia/gold-only; no
  generalization work now.** Confirmed, not just assumed: even
  though other markets/metals might be supported someday, building
  a configurable unit/metal system now would be exactly the kind
  of speculative abstraction `ai-workflow-rules.md` and
  `code-standards.md` warn against. Refactor `lib/constants/units.ts`
  into something configurable only when a real second market is
  actually requested.

- **Spot-vs-shop-premium disclaimer: confirmed as a one-liner near
  the price header, not a more prominent first-login notice.**
  Resolves the "exact copy is still open" note above — the
  placement was already the plan; this confirms it's the final
  placement decision, not a placeholder pending something more
  assertive. Exact wording is still an open UI-copy detail.

- **Free-tier ceilings (Clerk MAU, Neon storage): no upfront
  plan.** Given open public signup, usage could in principle
  approach Clerk's 10,000 MAU cap or Neon's 0.5 GB storage cap —
  deliberately not planning an upgrade path or a signup cutoff now.
  Revisit only if usage actually approaches either limit; see
  Known Constraints for the Neon storage math.

- **`RefreshButton` no longer disables itself during the manual
  refresh cooldown.** User reported that clicking Refresh a second
  time showed nothing. Root cause: `canManualRefresh` gated the
  `disabled` prop, so a second click never fired at all — the
  route's existing 429 `COOLDOWN` message (`"Price was just
  refreshed — try again in a few minutes"`) had no way to reach the
  user. Fix: `disabled` now tracks only `isPending` (the in-flight
  request); `canManualRefresh` still sets the initial `title`
  tooltip, but no longer blocks the click. The server remains the
  actual enforcement point — this only changes whether a client can
  ask and be told no.

- **Automatic refresh-on-entry: no change needed, already correct.**
  Investigated in response to "make sure the API refreshes when they
  enter if they haven't refreshed in a while" — `getPrice()`
  (`lib/price/getPrice.ts`) already runs on every `/dashboard` load
  via `app/dashboard/page.tsx`, and re-fetches from goldapi.io
  whenever the cached snapshot is older than `PRICE_STALENESS_MS`
  (30 minutes) before the page renders. This is separate from, and
  unaffected by, the manual-refresh button and its 10-minute
  cooldown.

- **Refresh button UI removed; the manual-refresh backend is kept,
  not deleted.** User decision: the dashboard already auto-refreshes
  the price on every page load when the cache is stale (see the
  entry above), so a free-tier manual-refresh button was redundant —
  reserved instead as a future paid-subscription feature ("no
  limits," i.e. presumably without the 10-minute cooldown).
  Removed: `components/dashboard/refresh-button.tsx` and its prop
  threading (`canManualRefresh`) through `HeroPriceCard` →
  `DashboardContent` → `app/dashboard/page.tsx`. Deliberately kept
  as-is, unused but ready to re-wire: `POST /api/price/refresh`
  (`app/api/price/refresh/route.ts`), `getLatestManualSnapshot`/
  `isManualCooldownActive` (`lib/price/getPrice.ts`), the
  `isManual` column on `price_snapshots`, and all their tests —
  ripping these out would mean re-doing this exact work (and another
  DB migration) when the paid tier is built.

- **Rate limiting — implemented, DB-backed fixed-window counter.**
  Resolves the top-priority item from the 2026-08-26 grilling
  session. New `rate_limit_counters` table (`lib/db/schema.ts`,
  migration `0002_spooky_luckman.sql`): one row per `(user_id,
  window_start)`, incremented via an atomic Postgres upsert
  (`incrementRequestCount`, `lib/db/queries/rateLimit.ts`) — `INSERT
  ... ON CONFLICT DO UPDATE SET count = count + 1`, so the database
  arbitrates concurrency per code-standards.md, not a
  check-then-write in JS. `windowStart` is floored to
  `RATE_LIMIT_WINDOW_MS` boundaries using the app clock (`Date.now()`),
  matching `isManualCooldownActive`'s existing pattern rather than a
  DB-time function. Limit: **20 requests per 5-minute window per
  Clerk `user_id`** (`lib/constants/rateLimit.ts`) — sized generously
  for legitimate manual use while still stopping a scripted burst;
  no real usage data to calibrate against yet, revisit if it turns
  out wrong in either direction. `isRateLimited(userId)`
  (`lib/api/rateLimit.ts`) wraps the increment and threshold check;
  called first thing (after the `auth()` check, before any DB read
  or Zod validation) in all three transaction-mutating handlers —
  `POST /api/transactions`, `PATCH` and `DELETE
  /api/transactions/[id]` — returning `429 RATE_LIMITED` on the
  existing `{ error: { code, message } }` envelope. A blocked
  request still increments the counter, which is what keeps the
  block in effect for the rest of the window instead of flapping.
  `GET /api/transactions` and the separate manual-refresh route
  (`/api/price/refresh`, its own independent 10-minute cooldown) are
  intentionally not covered — the decision was scoped to
  "transaction-mutating routes." No cleanup job for old counter rows
  yet; left as a known constraint, same reasoning `price_snapshots`
  got — row growth is bounded by active users × windows touched, not
  a near-term concern at this scale. Covered by
  `lib/db/queries/rateLimit.test.ts` (window flooring, upsert
  result), `lib/api/rateLimit.test.ts` (threshold logic), and a 429
  case added to each of the three routes' existing test files.

- **Clerk `user.deleted` webhook — implemented.**
  `app/api/webhooks/clerk/route.ts`, verified via `verifyWebhook`
  from `@clerk/nextjs/webhooks` (wraps svix under the hood — no new
  dependency needed). Unlike every other route, this one is
  authenticated by signature, not `auth()`, since Clerk calls it
  server-to-server with no session cookie. On `user.type ===
  "user.deleted"`, calls the new `deleteAllTransactionsForUser`
  query (`lib/db/queries/transactions.ts`) to remove every
  transaction row for that Clerk user id, resolving the orphaned-row
  open question. Every other event type returns 200 and is ignored,
  per Clerk's guidance not to 4xx on unhandled types (a 4xx triggers
  a retry). Requires `CLERK_WEBHOOK_SIGNING_SECRET` (added to
  `.env.example`) and the endpoint URL registered in the Clerk
  Dashboard's Webhooks section, subscribed to `user.deleted` — that
  dashboard-side registration has not been done yet, only the code
  side. Covered by `route.test.ts` (400 on bad signature, delete on
  `user.deleted`, no-op 200 on other event types).

- **Dashboard made responsive for mobile; four presentational
  components extracted for reuse.** User request, scoped via a
  grilling session on 2026-08-26 (see `ui-context.md`'s new
  Responsive Breakpoints section for the full breakpoint/component
  spec — this entry is the "why," that's the "what"). Sidebar
  becomes a hamburger-triggered slide-in drawer below `md` via a new
  `DashboardShell` wrapper; the transaction table becomes a stacked
  card list below `md` (`TransactionCard`, sharing row-computation
  logic with the desktop `Row` via a new `getRowDisplay` helper); the
  stat row goes 2-column below `lg` (4-column at `md` was tried and
  visually rejected — labels/values wrapped in the cramped columns);
  the hero price card stacks and shrinks its headline font below
  `sm`. Extracted `Panel` (card wrapper), `MonoValue` (mono
  tabular-nums text with a tone prop), `toneFromAmount` (gain/loss
  color decision), and `InlineBanner` (error/success message strip)
  so desktop and the new mobile card view can't drift on how the
  same figure is styled. Verified via Chrome DevTools at 375/768/1280px
  using a temporary mock-data preview route (deleted after use, never
  committed) since the real `/dashboard` needs a live Clerk session
  this environment doesn't have credentials for.

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
- **2026-08-26, later in the day:** user reported the Refresh
  button "doesn't really do anything." Root cause diagnosed (the
  30-minute price cache plus the existing 60s auto-refresh mean a
  manual click almost always re-renders identical numbers) and a
  fix plan was written and reviewed: force a real goldapi.io fetch
  on click, bypassing the cache, gated by a 10-minute global
  cooldown backed by a new `isManual` column on `price_snapshots`
  (not in-memory state, since that wouldn't survive serverless cold
  starts or be shared across instances). Plan file:
  `~/.claude/plans/my-refresh-button-deosnt-glimmering-turtle.md`.
  **Implemented in a later session** — see the "Refresh button
  reworked to bypass the cache for real" entry above; confirmed
  present in the working tree (`git status` shows the migration,
  `app/api/price/refresh/`, and the touched files, all uncommitted)
  and matching the plan. Remaining step: commit this work — nothing
  from the refresh-button rework has been committed to git yet.
