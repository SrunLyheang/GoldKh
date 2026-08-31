# Dashboard Expansion Plan

Status: **implemented** — Phases 0, D, A, B, C landed 2026-08-31; see
`progress-tracker.md` for the per-phase record and any deviations from
this spec (e.g. Settings ships with the Lucide `Settings` icon, not the
custom gear — §3 below). Created 2026-08-31 via a
grilling session (two rounds). Adds four things beyond today's single
dashboard: a reworked transaction panel, a full transactions route, a
detailed price-chart route, and an Insights route — plus a Settings
route and CSV import/export.

This file is the spec. It is not a progress log — once phases land,
record them in `progress-tracker.md` and fold the durable decisions
into `project-overview.md` / `ui-context.md` / `architecture.md` per
`ai-workflow-rules.md` §"Keeping Docs in Sync".

---

## 1. Goals

1. The transaction list stays on the dashboard as a compact overflow
   panel — 5 rows on desktop, 3 on mobile, rest by scroll — with **no
   filter UI**. A row click expands that row in place to full detail.
2. A dedicated `/dashboard/transactions` route holds the full table
   with all filtering (amount / date / quantity / direction) and sort.
   Reached from the sidebar **and** from a "View all" affordance on the
   dashboard panel.
3. CSV import/export is available both on the dashboard transaction
   panel and in the full transactions route.
4. A dedicated `/dashboard/price` route holds a detailed, interactive
   price-history chart (range brush, presets, crosshair). The compact
   dashboard chart gets an in-place range brush and a click target into
   this route.
5. A new **Insights** route answers "is my position any good" —
   headline readouts, portfolio value over time (using the same
   detailed-chart component inline), per-buy quality, and a what-if
   calculator.
6. A new **Settings** route holds account management, display
   preferences, and destructive data actions.
7. A bespoke 5-icon nav set, drawn to the Vault theme, replaces generic
   icons.

## 2. Non-goals (explicit YAGNI)

- No allocation / pie chart on Insights — one asset class.
- No buy/sell cadence chart, no moving averages, no technical
  indicators.
- No KHR anywhere new. KHR display is deferred project-wide
  (`project-overview.md`).
- No scheduled job / cron for portfolio snapshots. Price fetching is
  deliberately lazy (`architecture.md`); Insights and price charts are
  reconstructed / read from stored `price_snapshots` at read time.
  Revisit only if users ask for denser history.
- No external historical price backfill. "Go fully left" on any chart
  reaches the earliest stored snapshot and stops; presets that exceed
  available history clamp to "All".
- No notes/free-text search in the transaction filter.
- No new charting library. Recharts `<Brush>` + component-state domain
  covers pan/range; presets and crosshair are hand-wired.
- Locale stays `"en"` only.
- The Insights portfolio chart does **not** get its own route or nav
  item — it reuses the shared `DetailedChart` inline.

## 3. Navigation

Sidebar (`components/dashboard/sidebar.tsx`) and its mobile drawer.

| Item | Href | Placement | Custom icon |
| --- | --- | --- | --- |
| Dashboard | `/dashboard` | nav | 2×2 grid of squares, one filled |
| Transactions | `/dashboard/transactions` | nav | two horizontal arrows crossing (buy down-left / sell up-right) |
| Price | `/dashboard/price` | nav | stepped line over a short baseline (not a smooth swoosh) |
| Insights | `/dashboard/insights` | nav | square gauge / dial with a single tick |
| Settings | `/dashboard/settings` | footer user row, opposite `UserButton` (theme toggle on its own line above) | shipped with Lucide `Settings`; the custom 6-tooth gear was drawn then dropped post-Phase 0 — see progress-tracker.md |

- `NAV_ITEMS` gains Transactions, Price, Insights. Settings stays a
  separate footer `<Link>`.
- Active state: existing `pathname === href` rule. For `/dashboard`
  itself, match exactly (not `startsWith`) so child routes don't light
  up the Dashboard item.
- Dictionary: `nav.transactions`, `nav.price`, `nav.insights`,
  `nav.settings`.
- Routes nested under `app/dashboard/` so they inherit
  `app/dashboard/layout.tsx` (auth gate + `DashboardShell`).

### 3.1 Custom icon set

`components/icons/` — one `.tsx` per icon, each a 24×24 `<svg>` with
`stroke="currentColor"`, `strokeWidth={2}`, `strokeLinecap="square"`,
`strokeLinejoin="miter"`, `fill="none"` (square caps + miter joins
match Vault's 0-radius brutalist language; the filled square in the
Dashboard icon is the one `fill="currentColor"` exception). Props:
`{ className?: string }`, default `h-4 w-4` at call sites, `h-5 w-5` in
buttons — same sizing contract as the lucide icons they replace.

Documented lucide fallbacks if the custom set is later dropped:
`LayoutDashboard`, `ArrowRightLeft`, `CandlestickChart`, `Gauge`,
`Settings`.

## 4. Surface: reworked Dashboard transaction panel

`components/dashboard/transaction-history.tsx`.

### 4.1 Compact overflow list

- Desktop `<table>` scroll container shows **5 body rows** + sticky
  header before scrolling (down from `max-h-[320px]`). Mobile
  `TransactionCard` list shows **3 cards** then scrolls inside the same
  panel.
- **No filter row on the dashboard.** All filtering lives in
  `/dashboard/transactions` (§4b).
- Panel header holds: the section title (as a link — §4.3),
  `View all →`, `Import / Export`, `Add transaction`.

### 4.2 Row click → inline expand ("zoom in / zoom out")

- Clicking a row (desktop) or card (mobile) toggles an expanded region
  under it showing everything the compact view omits: full date, notes,
  price per unit, spot price on that date (nearest snapshot at/before
  `transactionDate`, "—" if none that old), and the P&L breakdown
  (proceeds/cost basis for the row). Click again to collapse.
- One row expanded at a time. Expansion state is component-local
  `useState<string | null>` (the row id).
- The `⋯` actions menu and any link inside the row `stopPropagation` so
  they don't toggle the expander.
- Keyboard: the row is a `<button>`-semantics target (`role`, `tabIndex`,
  Enter/Space), `aria-expanded`.
- Extracted into `getRowDisplay` consumers so desktop `Row` and mobile
  `TransactionCard` share the expanded-detail markup
  (`TransactionDetail` sub-component).

### 4.3 Clickable dashboard sections

- The **section title** in the Transaction History panel and the Price
  History panel becomes a `<Link>` ("Transaction History →" /
  "Price History →") to `/dashboard/transactions` and `/dashboard/price`
  respectively.
- The Price History **chart plot area** is also a click target into
  `/dashboard/price`. Inner controls (Refresh, Brush handles) live in
  their own stacking/interaction layer and `stopPropagation`.
- Not the whole panel — panels hold Add / CSV / row menus / Refresh and
  nesting click targets is an accessibility problem.

### 4.4 Mobile card polish

- Top line: larger buy/sell chip (`h-5 w-5` icon) + type label + date,
  min 44px touch row, more vertical padding.
- Body: 2×2 grid (Paid / price-per-damlung / Current Value / P&L) with
  larger type and spacing.
- `⋯` actions target grows to 44px.
- Row is the expand toggle (§4.2).

### 4.5 CSV import / export

`components/dashboard/csv-dialog.tsx` (`"use client"`), launched from an
`Import / Export` button. **Rendered in two places**: the dashboard
transaction panel header, and the `/dashboard/transactions` header. Same
component, same behaviour.

**Export**
- Client-side. `lib/csv/serializeTransactionsCsv.ts` turns the loaded
  rows into CSV; `Blob` + object URL triggers the download. No endpoint.
- Columns: `type,quantity,unit,total_paid,currency,date,notes`
  (`total_paid = pricePerUnit × quantity`, matching the dialog's "Total
  amount paid" input).
- Filename: `goldkh-transactions-YYYY-MM-DD.csv`.

**Import**
- User picks a `.csv`. `lib/csv/parseTransactionsCsv.ts` parses it
  (RFC-4180-ish: quoted fields, embedded commas, `\r\n`; hand-rolled,
  add `papaparse` only if it gets hairy).
- Each row validated against the **existing**
  `lib/validation/transaction.ts` Zod schema (deriving `pricePerUnit`
  from `total_paid ÷ quantity` as the dialog does).
- Preview table: per-row pass/fail badge + first error message.
  Exact-duplicate detection against existing rows → non-blocking
  "duplicate" warning.
- On confirm: valid rows POST to `/api/transactions/bulk` (§7) in one
  request. Failed rows stay in the preview.
- After success the surrounding page reconciles via `router.refresh()`
  in a `useTransition`, same as add/edit.
- Dictionary keys under `csv.*`.

## 4b. Surface: full transactions route (`/dashboard/transactions`)

`app/dashboard/transactions/page.tsx` — server component. Loads the
user's transactions + recent price snapshots + current price. Renders
`components/transactions/transactions-view.tsx` (`"use client"`).

- Full `<table>` (desktop) / card list (mobile) of **all** rows, its own
  scroll, sticky header, same row/expand behaviour as §4.2.
- **Filter row** — `components/transactions/transaction-filters.tsx`,
  all optional, AND-combined, client-side over the loaded rows:

  | Filter | Control | Match rule |
  | --- | --- | --- |
  | Amount paid | number + fixed ±10% | `total = pricePerUnit × quantity` within ±10% |
  | Date | from / to (either optional) | `transactionDate` in range, inclusive |
  | Quantity | number + unit `Select` | exact match on quantity **and** unit |
  | Direction | segmented `All / Buy / Sell` | `type` match |

- Sort: by date (default, desc) or by P&L; click a column header.
- Filtering + sorting are pure: `lib/calc/filterTransactions.ts`
  (`(rows, criteria, currentPricePerTroyOz) => rows` — the price feeds
  the per-row P&L used by the "pnl" sort), unit tested.
- Mobile: filters collapse behind a `Filter (n)` button.
- Header holds the CSV `Import / Export` button (§4.5) and a back link
  to `/dashboard`.
- Filter/sort state is component-local. Not persisted, not in the URL
  for v1.
- Dictionary keys under `filters.*`.

## 5. Surface: Insights (`/dashboard/insights`)

`app/dashboard/insights/page.tsx` — server component; loads the same
two queries the dashboard uses plus current price; passes them to
`components/insights/insights-content.tsx`.

Four sections, each a `Panel size="lg"` in the 32px block rhythm with a
`.tt-heading .tt-bracket` header.

### 5.1 Readouts

`components/insights/readouts.tsx`. 3–4 one-line statements from pure
calc:
- Average cost vs spot — "Your average cost is X% below/above spot."
- Total invested — "You've put in $X across N buys."
- Net position — "+$X unrealized, +$Y realized." (reuses
  `computeGainLoss`, `computeRealized`)
- Largest position — "Largest buy: Q chi on DATE."

`lib/calc/insights.ts` for the "largest buy" / "total invested"
aggregates only.

### 5.2 Portfolio value over time

`components/insights/value-over-time.tsx` — wraps the shared
`DetailedChart` (§D) inline: compact height by default, in-place range
brush, but **no** route/nav (it's portfolio data, not spot price).
Two series: market value and cost basis.

Data: `lib/calc/portfolioSeries.ts` — pure. For each `price_snapshot`
timestamp `t`, replay transactions with `transactionDate <= t`, compute
holdings via `computeHoldings`, then:
- cost basis at `t` = `totalTroyOz × averageCostPerTroyOz`
- market value at `t` = `totalTroyOz × snapshotPrice(t)`

Fewer than 2 points → the empty-state treatment `PriceHistoryChart`
already uses.

### 5.3 Buy history

`components/insights/buy-history.tsx`. Table of every `buy`: Date,
Quantity, Paid, spot price on that date, `vs spot` % with gain/loss
tone. Sortable by date or `vs spot`. Pure helper
`lib/calc/buyQuality.ts`.

### 5.4 What-if calculator

`components/insights/what-if.tsx` (`"use client"`). Stateless. Inputs:
hypothetical buy quantity + unit + total price. Outputs via existing
`lib/calc` + a thin `lib/calc/whatIf.ts`:
- new blended average cost per damlung
- new total holdings (chi + damlung)
- break-even spot price per damlung for the new blended position

No persistence, no API.

Dictionary keys under `insights.*`.

## D. Surface: detailed price chart (`/dashboard/price`) + shared component

### D.1 `DetailedChart` component

`components/charts/detailed-chart.tsx` (`"use client"`). One reusable
interactive time-series chart, used by:
- `/dashboard/price` (spot price per damlung)
- the compact dashboard price chart (in-place, via a `compact` prop)
- the Insights portfolio chart (§5.2, two series)

Props: `{ series: {key,label,color,data:{t:number,value:number}[]}[],
compact?: boolean, onExpand?: () => void }`.

Features:
- Recharts line chart + `<Brush>` for drag-to-range ("go fully left and
  right"). Domain held in component state; Brush `onChange` updates it.
- `compact` mode: Brush only, reduced height, an `Expand ↗` control
  calling `onExpand`. Plot area is a click target when `onExpand` is
  set.
- Full mode (`/dashboard/price`): range-preset buttons
  (`1W / 1M / 3M / All`, clamped to available history), a crosshair +
  value tooltip on hover, the Brush, taller height.
- No new dependency. Presets compute a domain window off `Date.now()`
  and the earliest datum.
- Empty state (<2 points) reuses the existing pattern.

### D.2 `/dashboard/price` route

`app/dashboard/price/page.tsx` — server component. Loads
`listRecentPriceSnapshots()` (and, if a fuller history query is wanted
later, a widened one — for v1 reuse the existing query), builds the
per-damlung series with `buildDamlungPriceSeries`, renders
`DetailedChart` full-mode plus: the current price header, the "as of"
timestamp, market-closed treatment (reuse `isMarketOpen`), and the
average-cost `ReferenceLine` when the user holds a position (same as the
compact chart today). Back link to `/dashboard`.

### D.3 Compact dashboard chart

`components/dashboard/price-history-chart.tsx` — refactored to render
`DetailedChart` with `compact` + `onExpand={() => router.push("/dashboard/price")}`.
Keeps its section-title link (§4.3). The existing break-even
`ReferenceLine` and market-closed badge move into or are passed through
`DetailedChart`.

Dictionary keys under `chart.*` (extend the existing block).

## 6. Surface: Settings (`/dashboard/settings`)

`app/dashboard/settings/page.tsx` — server-component shell; three groups
as client islands.

### 6.1 Account
Embed Clerk `<UserProfile routing="hash" />` in a `Panel`, `appearance`
mapped to Vault tokens (same approach as sign-in/sign-up).

### 6.2 Preferences
`components/settings/preferences.tsx` (`"use client"`).
- Default display unit (chi / damlung) + default currency (USD / KHR),
  persisted to `localStorage` (`goldkh-prefs`) via new
  `lib/prefs/prefs-context.tsx` (mirrors `LocaleProvider`'s
  hydration-safe pattern), provided in `DashboardShell`. `DashboardContent`
  seeds its `displayUnit` state from prefs instead of hardcoded
  `"damlung"`.
- Theme — reuse `ThemeToggle`. Sidebar keeps its quick toggle.

### 6.3 Data
`components/settings/data-actions.tsx` (`"use client"`).
- Export transactions — reuses §4.5 export helper.
- Delete all transactions — confirm → `DELETE /api/transactions`
  (bulk, session-scoped).
- Delete account — confirm → `DELETE /api/account` (calls Clerk backend
  `users.deleteUser(userId)`; DB cleanup via the existing `user.deleted`
  webhook). Client redirects to `/`.

Dictionary keys under `settings.*`.

## 7. New / changed API routes

Per `code-standards.md`: Zod input, `auth()` first, ownership enforced,
`{ data } | { error: { code, message } }` envelope, rate limited where
mutating.

| Route | Method | Purpose | Notes |
| --- | --- | --- | --- |
| `/api/transactions/bulk` | `POST` | Bulk-insert imported rows | `{ transactions: NewTransactionInput[] }`, capped at 200. Validates every row; all-or-nothing insert in one DB call. One rate-limit token. `{ data: { inserted } }` or `{ error }` + per-index issue list. |
| `/api/transactions` | `DELETE` | Delete all caller's transactions | Session-scoped. Rate limited. `{ data: { deleted } }`. |
| `/api/account` | `DELETE` | Delete caller's Clerk user | `clerkClient.users.deleteUser(userId)`. DB cleanup via `user.deleted` webhook. Rate limited. |

New query helpers in `lib/db/queries/transactions.ts`:
`createManyTransactionsForUser(userId, inputs[])`,
`deleteAllTransactionsForUser(userId)`.

## 8. Data model

No schema change. No new table. No migration. Filtering, CSV, what-if,
readouts, buy-history, portfolio series, and the detailed price chart
are all derived at read time from `transactions` and `price_snapshots`,
per `code-standards.md` ("derived values are computed at read time from
the ledger").

If snapshot sparsity later makes the portfolio chart useless, the
follow-up is a `portfolio_snapshots` table written on each dashboard
load (still no cron) — out of scope here; noted for
`progress-tracker.md` Open Questions.

## 9. Testing

Every phase ends green on `tsc --noEmit`, `eslint`, `vitest run`,
`next build`.

- Pure modules (`filterTransactions`, `portfolioSeries`, `buyQuality`,
  `whatIf`, `insights`, `parseTransactionsCsv`,
  `serializeTransactionsCsv`) — direct table-driven unit tests covering
  the worked examples here.
- Components — RTL for the behaviour that matters: row click expands and
  collapses; filter narrows visible rows; CSV preview flags a bad row
  and disables commit; what-if recomputes on input; `DetailedChart`
  Brush change narrows the domain; delete-account confirm gates the
  call; section-title link points at the right route.
- New API routes — route tests mirroring `app/api/transactions/*`: auth
  required, ownership scoped, envelope shape, rate-limit wrapper
  present, malformed body → 400, 200-row cap enforced.
- `vitest.setup.ts` — add a `prefs-context` mock only if it throws
  outside its provider in existing tests (same fix used for
  `locale-context`).

## 10. Context files to update as phases land

| File | Change |
| --- | --- |
| `progress-tracker.md` | One "Done:" entry per phase; move the snapshot-density question into Open Questions. |
| `project-overview.md` | In Scope gains: full transactions route, transaction filtering, CSV import/export, detailed price chart route, Insights, Settings. |
| `ui-context.md` | Nav now five destinations (4 + gear) with the custom icon set; new Layout Patterns entries for the row-expand, clickable section titles, `/dashboard/transactions`, `DetailedChart` + `/dashboard/price`, Insights sections, Settings groups; mobile card rework; the overflow-table row budget replaces "States Not Yet Designed → Long transaction lists". |
| `architecture.md` | New `/api` routes; the deliberate "reconstruct / read stored snapshots, don't add a cron" choice for the charts and why. |

## 11. Phases

Order: **`0 → D → (A, B, C in parallel)`**. Phase 0 is the shared shell
and must run first and alone. Phase D builds `DetailedChart`, which
Phase C imports — so D precedes C. A, B, C touch disjoint files after
that (with two small additive exceptions, noted).

### Phase 0 — Shared shell (one chat, first, alone)

Owns: `components/dashboard/sidebar.tsx`, `lib/i18n/dictionary.ts`,
`components/icons/*` (new), and stub routes
`app/dashboard/transactions/page.tsx`,
`app/dashboard/price/page.tsx`,
`app/dashboard/insights/page.tsx`,
`app/dashboard/settings/page.tsx`.

- Build the 5 custom icons (§3.1).
- Add Transactions / Price / Insights to `NAV_ITEMS` with the custom
  icons; add the Settings gear `<Link>` in the footer. Fix the
  `/dashboard` active-match to be exact.
- Add every dictionary namespace this plan introduces (`nav.*` additions,
  `filters.*`, `csv.*`, `insights.*`, `settings.*`, `chart.*` additions)
  with English copy, so later phases never touch `dictionary.ts`.
- Create the four routes as minimal server-component stubs rendering a
  titled empty `Panel`.
- Green on all four checks. `progress-tracker.md` "Done: Phase 0".

### Phase D — Detailed chart + `/dashboard/price` (one chat, after 0)

Owns: `components/charts/detailed-chart.tsx` (new),
`components/charts/detailed-chart.test.tsx` (new),
`app/dashboard/price/page.tsx` (fill the stub),
`components/dashboard/price-history-chart.tsx` (refactor to consume
`DetailedChart` in `compact` mode + `onExpand` + section-title link).

- D1 `DetailedChart` compact mode (Brush, expand affordance) + tests.
- D2 `DetailedChart` full mode (presets, crosshair) + tests.
- D3 `/dashboard/price` route wired to it (header, timestamp,
  market-closed, avg-cost ReferenceLine).
- D4 refactor the compact dashboard chart onto it; keep behaviour.
- Green on all four checks. Doc updates per §10.

### Phase A — Transaction panel + full transactions route + CSV (one chat)

Owns: `components/dashboard/transaction-history.tsx`,
`components/dashboard/csv-dialog.tsx` (new),
`components/dashboard/dashboard-content.tsx`,
`app/dashboard/transactions/page.tsx` (fill the stub),
`components/transactions/*` (new: `transactions-view.tsx`,
`transaction-filters.tsx`, shared `transaction-detail.tsx`),
`lib/calc/filterTransactions.ts` (new),
`lib/csv/parseTransactionsCsv.ts` (new),
`lib/csv/serializeTransactionsCsv.ts` (new),
`app/api/transactions/bulk/route.ts` (new),
`lib/db/queries/transactions.ts` (append `createManyTransactionsForUser`),
plus tests.

- A1 compact overflow list (5 / 3) + mobile card polish.
- A2 row click → inline expand (`TransactionDetail`, shared desktop/
  mobile).
- A3 clickable section titles → routes (Transaction History + Price
  History panels).
- A4 CSV export (client only) + `serializeTransactionsCsv`.
- A5 `/api/transactions/bulk` + `createManyTransactionsForUser`.
- A6 CSV import dialog wired to A5; mount it in the dashboard panel.
- A7 `/dashboard/transactions` route: full table + `transaction-filters`
  + `filterTransactions` + sort + CSV button + back link.
- Green on all four checks. Doc updates per §10.

### Phase B — Settings (one chat)

Owns: `app/dashboard/settings/page.tsx` (fill the stub),
`components/settings/*` (new),
`lib/prefs/prefs-context.tsx` (new),
`components/dashboard/dashboard-shell.tsx` (wrap in `PrefsProvider`),
`components/dashboard/dashboard-content.tsx` (seed `displayUnit` from
prefs — **also edited by Phase A**; this is a one-line `useState`
initializer change, land it last and rebase if A is in flight),
`app/api/transactions/route.ts` (add `DELETE`),
`app/api/account/route.ts` (new),
`lib/db/queries/transactions.ts` (append `deleteAllTransactionsForUser`
— **also appended by Phase A**; append, don't reorder),
plus tests.

- B1 `PrefsProvider` + Preferences panel (unit / currency / theme).
- B2 Account panel (Clerk `<UserProfile />` embed).
- B3 Data panel + `DELETE /api/transactions` + `DELETE /api/account`.
- Green on all four checks. Doc updates per §10.

### Phase C — Insights (one chat, after D)

Owns: `app/dashboard/insights/page.tsx` (fill the stub),
`components/insights/*` (new),
`lib/calc/insights.ts`, `lib/calc/portfolioSeries.ts`,
`lib/calc/buyQuality.ts`, `lib/calc/whatIf.ts` (all new),
plus tests. Imports `components/charts/detailed-chart.tsx` from Phase D
(read-only — no edit).

- C1 `portfolioSeries` + value-over-time (wraps `DetailedChart` inline).
- C2 `buyQuality` + buy-history table.
- C3 `insights` aggregates + readouts.
- C4 `whatIf` + calculator.
- Green on all four checks. Doc updates per §10.

### Shared-file contention

| File | 0 | D | A | B | C |
| --- | --- | --- | --- | --- | --- |
| `sidebar.tsx` | write | — | — | — | — |
| `dictionary.ts` | write | — | — | — | — |
| `components/icons/*` | write | — | — | — | — |
| stub routes | write | fill `price` | fill `transactions` | fill `settings` | fill `insights` |
| `price-history-chart.tsx` | — | refactor | reads route path only | — | — |
| `detailed-chart.tsx` | — | write | — | — | import only |
| `dashboard-content.tsx` | — | — | edit | 1-line edit | — |
| `transactions.ts` (queries) | — | — | append | append | — |
| `dashboard-shell.tsx` | — | — | — | edit | — |

Real overlaps: `dashboard-content.tsx` and
`lib/db/queries/transactions.ts`, both between **A and B only**, both
additive. Run A before B (B rebases), or run A and B in the same chat.
D must finish before C starts. C is otherwise independent of A and B.
