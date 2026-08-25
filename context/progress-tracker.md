# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- In progress — architecture settled, implementation not started.

## Current Goal

- Build the price layer: schema, one working provider, then
  `getPrice()`.

## Completed

- Architecture defined and reviewed.
- Price fetching strategy decided (lazy refresh over cron).
- Cache shape decided (append-only history over single
  overwritten row).
- Encryption question resolved.

## In Progress

- None yet.

## Next Up

In this order — do not skip ahead, and prove each step works
before starting the next:

1. `price_snapshots` table and its migration.
2. `lib/price/providers/` — one module for a single provider,
   returning the normalized shape or throwing. Prove one provider
   works end to end before writing any rotation logic.
3. `getPrice()` — read newest, check age, return if fresh,
   otherwise walk the provider list, insert, return.
4. Point the dashboard at `getPrice()` and delete every direct
   external API call.
5. `transactions` table and migration.
6. Transaction create route, with session-scoped ownership.
7. `lib/calc/` — weighted average cost, holdings totals,
   gain/loss.
8. Dashboard rendering derived values.

## Open Questions

- Project name.
- Clerk `user.deleted` webhook — a deleted user currently leaves
  orphaned transaction rows. Not urgent, but unhandled.
- Price-history chart. `price_snapshots` only captures whenever a
  request found the cache stale — clustered, with gaps wherever
  nobody loaded the dashboard. A chart needs regularly-spaced
  points, so this requires a separate history table and a backfill
  mechanism independent of the cron job we ruled out. Resolve
  before scoping the chart — it is not in Next Up until this is
  answered. (Undecided-and-blocked, not out of scope.)
- Rate limiting — not yet designed. If implemented, key on Clerk
  `user_id`, not IP (every route is already authenticated). Watch
  for the serverless trap: an in-memory `Map` counter works
  locally and silently enforces nothing in production, since each
  invocation may be a fresh instance — shared state (database or
  external store) is required. Doesn't block steps 1-5; should be
  resolved before step 6 exposes a public mutating route.
- Stale-price visual treatment. `project-overview.md` Success
  Criterion 3 requires the dashboard to render on total provider
  failure using the last cached price, but no visual state exists
  for it — `ui-context.md`'s own "States Not Yet Designed" list
  names it without resolving it. A success criterion with no
  design behind it. Blocks step 8.

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

- The architecture diagram to work from has the browser and
  `clerkMiddleware` above a dashed Next.js server boundary
  containing route handlers and `getPrice()`, with external
  providers below `getPrice()` and Postgres holding
  `transactions` and `price_snapshots`.
- Providers to use: goldapi.io and the Binance PAXG/USDT
  websocket. goldapi.io has been used before on the earlier
  single-user version.
- The price cache read path — `price_snapshots` back up to
  `getPrice()` — is deliberately absent from the diagram to keep
  it readable. It exists in the code.
- A provider returning HTTP 200 with an error body is the
  expected failure mode to guard against in the rotation logic.
