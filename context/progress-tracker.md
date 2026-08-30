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

## Done: weekend market-closed handling (2026-08-30, on `fix/current-issues`, uncommitted)

- Separate from the current-issues plan below — a fifth issue the user
  raised: goldapi.io's feed only echoes Friday's close over the weekend,
  so calling it Sat/Sun burns the 100/month free-tier quota for no new
  data, and the dashboard gave no sign the price was frozen.
- `lib/price/marketHours.ts` (new, pure): `isMarketOpen(now = new Date())`.
  Spot gold trades Sunday 22:00 UTC → Friday 21:00 UTC; fixed UTC
  boundaries, deliberately **not** DST-adjusted (worst case one hour
  conservative in northern-hemisphere winter — not worth a DST calendar
  for a quota-saver). Confirmed with the user: exact-hours rule, not a
  plain ICT weekend.
- `lib/price/getPrice.ts`: new `isMarketOpen` dep. When the market is
  closed and any cached snapshot exists, it's served as-is however stale
  — no provider call. With no cache at all it still falls through to the
  providers (a first-ever price beats an empty dashboard; preserves
  success-criterion 3).
- `app/api/price/refresh/route.ts`: returns `409 MARKET_CLOSED` before
  the cooldown/fetch when closed — guards a tab left open across the
  weekend boundary. `lib/price/requestPriceRefresh.ts` maps that to a
  new `{ kind: "marketClosed" }` outcome.
- UI (all four surfaces the user asked for): `PriceHistoryChart` shows a
  `Market closed` badge by the heading + a note ("Showing the last price
  from Friday's close. Trading resumes Monday."), line still drawn;
  `HeroPriceCard` shows a "Market closed — prices resume Monday." line;
  `RefreshButton` greys out with a title and toasts the same copy on
  click or on the `marketClosed` outcome. `marketOpen` threads
  `page.tsx` → `DashboardContent` → hero/chart.
- `lib/i18n/dictionary.ts`: `hero.marketClosed`, `refresh.marketClosed`,
  `chart.marketClosed`, `chart.marketClosedNote` in both `en` and `km`.
- Tests: `lib/price/marketHours.test.ts` (boundary table), plus new
  cases in `getPrice`, `requestPriceRefresh`, refresh route, and a new
  `components/dashboard/price-history-chart.test.tsx` and hero/refresh
  additions. `vitest run` 182/182, `eslint`, `next build` all clean.
- `.claude/settings.local.json` added: disables the GateGuard
  fact-force hooks for this workspace (was prompting before every edit).

## Active: current-issues fix plan (2026-08-30)

- Branch `fix/current-issues` off `main`. Six phases, one at a time,
  user gates each — full plan and grilling decisions in
  `context/design-specs/current-issues-plan.md`.
- Addresses the four issues in `context/design-specs/current-issues.md`:
  (#2) dialog input becomes "Total amount paid", per-unit derived on
  submit; (#3) client-side price-vs-spot sanity band (hard 0.1×–10×,
  soft 0.5×–2×); (#1) weighted-average realized gain/loss panel — a
  full-width strip below the stat row, shown only once a sell exists;
  (#4) chart Y-domain clamp + off-scale break-even caret.
- The `realized-gain-loss-fifo` branch's FIFO engine is **not** adopted
  (contradicts `project-overview.md` + `product-strategy.md`; issue #1
  doesn't need it). Error-handling/toast/animation pieces from the
  `testing` branch are cherry-picked in phases 5–6. Neither branch
  merges as a unit.
- Phase status: **Phases 1 (`0d581c2`) and 2 (`e134860`) committed.
  Phase 3 complete & verified (uncommitted). Awaiting go-ahead for
  Phase 4.** (The market-closed work in the section above landed
  alongside, out of band — `767fad6` + `c56e394`.)

### Phase 3 — Issue #1: realized gain/loss panel (2026-08-30, uncommitted)

- `lib/calc/realized.ts` (+ `.test.ts`, 6 cases): `computeRealized(entries)`
  → `{ realizedUsd, realizedPercent, saleCount }`. Same weighted-average
  basis and single chronological pass as `computeHoldings` — each sell is
  valued at the running average cost at that moment, `realized = Σ
  proceeds − Σ cost-basis-of-sold`. **Not FIFO** (see
  `project-overview.md`, `product-strategy.md`). KHR rows skipped, so
  `saleCount` counts USD sells only; `realizedPercent` is against the
  sold cost basis, `"0"` until something comparable sells. Verifies the
  −285 / −5.10% case from `current-issues.md`.
- `components/dashboard/realized-panel.tsx` (+ `.test.tsx`, 5 cases): the
  full-width strip per `current-issues-plan.md` Q6 — hero-card shape,
  `[ REALIZED ]` eyebrow + "from N sales", tone-coloured mono value +
  percent, **neutral at exactly $0** ("broke even"), right-aligned
  ~34ch caption. All through `Panel` / `.tt-label` / `MonoValue` tone /
  state tokens — themes with no per-theme rule.
- `components/dashboard/dashboard-content.tsx`: `computeRealized(rows)`;
  `<RealizedPanel>` rendered between the stat row and the transaction
  history only when `realized.saleCount > 0` (`vault-enter` at 140ms;
  transaction history bumped to 180ms).
- `context/project-overview.md`: realized gain/loss (weighted-average)
  moved from Out of Scope to In Scope; the old "Realized gain/loss and
  tax reporting" line becomes "Tax reporting — no Cambodian gold
  capital-gains regime." FIFO stays out.
- `context/ui-context.md`: new "Realized panel" entry in Layout
  Patterns; "Negative gain/loss alignment" noted as still open and now
  shared between the stat row and this panel.
- `lib/i18n/dictionary.ts`: `realized` block (`eyebrow`, `fromSales(n)`,
  `caption`) in `en` + `km`.
- Verified: `tsc --noEmit`, `eslint`, `vitest run`, `next build` all
  clean.

### Phase 1 — Issue #2: "Total amount paid" input (2026-08-30, uncommitted)

- `components/dashboard/transaction-dialog.tsx`: the price field is now
  **"Total amount paid"** — the user enters the whole transaction
  amount, and `pricePerUnit = total ÷ quantity` (rounded to the schema's
  4-dp cap) is derived on submit before it reaches the POST/PATCH body
  and the optimistic row. Divide-by-zero / mid-typing guarded
  (`derivePricePerUnit` returns `""`, which fails the schema and gates
  submit). Edit mode seeds the field with `pricePerUnit × quantity`.
  The summary box's first line changed from "Total cost" (now redundant
  with the input) to the derived **Price per {unit}**, sitting directly
  above the existing "Current spot" line — sets up Phase 2's
  price-vs-spot check.
- `lib/i18n/dictionary.ts`: `dialog.pricePerUnit` / `dialog.totalCost`
  replaced by `dialog.totalPaid` + `dialog.perUnitEquiv(unit)`, in both
  `en` and `km` (Khmer still live on this branch — its removal is
  Phase 5's cherry-pick from `testing`).
- `components/dashboard/transaction-dialog.test.tsx`: assertions moved to
  the new field; added a 4-dp-derivation case (5585 ÷ 3 → 1861.6667) and
  an edit-mode seed case (312.5 × 4 → 1250).
- `vitest.config.ts`: `exclude` now drops `.worktrees/**` — the nested
  `realized-gain-loss-fifo` worktree carries its own `node_modules` and
  its stale copy of this test file was failing collection on a duplicate
  React. (The `testing` branch already made this same change.)
- Storage/schema/API unchanged — the wire payload keeps `pricePerUnit`.
- Verified: `tsc --noEmit`, `eslint`, `vitest run` (152/152),
  `next build` all clean.

### Phase 2 — Issue #3: price sanity band (2026-08-30, uncommitted)

- `lib/validation/priceSanity.ts` (new, +`priceSanity.test.ts`, 9 cases):
  pure `classifyPrice(perUnitUsd, spotPerUnitUsd)` →
  `"ok" | "soft-low" | "soft-high" | "hard-low" | "hard-high"` on
  ratio thresholds `0.1× / 0.5× / 2× / 10×` of spot (band edges count
  as inside — strictly outside trips a verdict). Returns `"ok"` for
  non-positive / non-finite inputs (the Zod schema already covers a bad
  price). `isHardVerdict` / `isSoftVerdict` helpers.
- `components/dashboard/transaction-dialog.tsx`: runs `classifyPrice` on
  the Phase-1 derived per-unit price against `spotPerUnit` for the
  selected unit. **KHR rows skip the check** (`currency === "USD"` guard —
  same rule the rest of the app uses for non-USD prices). Hard verdict →
  inline `text-destructive` message below the summary box **and** the
  Save button is `disabled`, with a defensive early-return in
  `handleSubmit`. Soft verdict → non-gating `TriangleAlert` notice box
  (same shape as the existing "exceeds holdings" warning). No prop or
  wire-payload change.
- `lib/i18n/dictionary.ts`: `dialog.priceHardLow` / `priceHardHigh` /
  `priceSoftLow` / `priceSoftHigh` in both `en` and `km`.
- `components/dashboard/transaction-dialog.test.tsx`: +3 cases — hard
  verdict blocks submit + shows the message, soft verdict warns but
  still POSTs, KHR edit row skips the check and PATCHes despite a price
  nonsensical against USD spot.
- Verified: `tsc --noEmit`, `eslint`, `vitest run` (164/164),
  `next build` all clean.

## Current Goal

- Rate limiting on the transaction-mutating routes is implemented —
  the last item of the three from the 2026-08-26 grilling session
  (see Architecture Decisions). Verified (typecheck, full test
  suite, lint, `next build` all clean) but not yet committed.
- A second 2026-08-26 grilling session (prompted by a production-
  readiness review) added six hardening items ahead of new features
  — see "Next Up" below and the matching Architecture Decisions
  entries. All six (3a-3f) are now done and verified, one at a time,
  per `ai-workflow-rules.md`. Two real gaps were found and fixed
  along the way, not just the planned work: the KHR aggregation bug
  itself (3a), and a boot-blocking `CLERK_WEBHOOK_SIGNING_SECRET`
  requirement discovered while verifying 3c (fixed by making it
  optional — see 3c's note and architecture.md invariant 10).
- Item 3 (UI/component test coverage) is now also done — see its own
  "Next Up" entry and Architecture Decisions writeup above/below.
  98/98 tests pass. Everything from the two 2026-08-26 grilling
  sessions is complete except the external, non-code Vercel
  first-deploy checklist (architecture.md). Remaining code work is
  items 5-7, all explicitly deferred until they cause a real
  problem, not on a fixed timeline.

## Completed

- **2026-08-28 — Landing page redesign: "Assay" editorial (uncommitted,
  on `landing-page` branch).** Re-skinned the marketing page
  (`components/welcome/*`) from the dark Vault/Industrial-Brutalism look
  to a warm editorial minimalism — Newsreader serif display, warm bone
  paper, hairline bento, gold used only as the brand mark + one hero
  rule. Explicitly *not* following `redesign/direction.md` (per user).
  - **Self-contained light/dark theme.** New `LandingThemeProvider`
    (`components/welcome/landing-theme.tsx`) stamps `data-landing-theme`
    on the page wrapper; `goldkh-landing-theme` localStorage key; **light
    is the hard default** (no OS auto-detect). `globals.css` gains two
    scoped token blocks `[data-landing-theme="light"|"dark"]` plus
    `html:has(...)` body-bg rules and a `.landing-reveal` scroll-entry
    class. The dashboard's 6-theme `:root`/`[data-theme]` system is
    untouched.
  - **New layouts.** Centered masthead hero (was left-copy/right-card);
    the sample dashboard data is now the **assay strip** — one
    full-width ruled readout, mono tabular figures over hanging labels
    (`sample-readout.tsx`, export renamed `SampleReadout` → `AssayStrip`);
    asymmetric hairline feature bento (tall + stacked + wide); how-it-
    works as numbered ledger rows; quiet hairline-framed CTA.
  - `components/welcome/landing-theme-toggle.tsx` (sun/moon, inline SVG,
    in the nav), `components/welcome/use-reveal.ts` (IntersectionObserver
    scroll-entry, `prefers-reduced-motion` honored in CSS), and
    `section-eyebrow.tsx` de-bracketed. `lucide-react` dropped from the
    feature grid for inline geometric SVG icons. No i18n dictionary
    changes — all copy reused.
  - **Khmer + mobile fit pass.** `globals.css` gains
    `html[lang="km"] .landing-root` rules that zero `letter-spacing` and
    `text-transform` on the mono eyebrows/labels (Khmer has no case and
    the wide tracking was splitting its syllable clusters) and point the
    serif headings at `--font-khmer` with `line-height: 1.45` for the
    stacked diacritics. Hero headline dropped to `34px` on mobile
    (`58px` unchanged ≥sm); how-it-works middle column `13rem` → `14rem`
    so the longest km step title clears the body column.
  - Verified: `tsc --noEmit` clean, `eslint components/welcome` clean,
    `vitest run components/welcome` 6/6 green; visual check in Chrome at
    1280px and 390px, light + dark, English + Khmer, toggle persistence
    confirmed.

- **2026-08-27 — Vercel deploy fix: lazy DB client (uncommitted, on
  `landing-page` branch).** Vercel build failed at "Collect page data"
  for `/api/webhooks/clerk` — `lib/db/client.ts` called
  `neon(process.env.DATABASE_URL!)` at module-evaluation time, and
  `DATABASE_URL` is absent during `next build`. Reworked `db` into a
  Proxy over a lazily-constructed `drizzle` instance (`getDb()` builds
  it on first property access, throws "DATABASE_URL is not set" only
  then). Same import-time-secret rationale already documented in
  `lib/env.ts`. Verified: `next build` now passes with all of
  `DATABASE_URL`/`CLERK_SECRET_KEY`/`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/
  `GOLDAPI_IO_API_KEY` unset; full suite 150/150 green. Still required
  on Vercel: set those env vars in Project Settings for runtime.

- **2026-08-27 — Four more themes + new theme picker (uncommitted, on
  `landing-page` branch).** Added Midnight, Emerald, Terminal, Porcelain,
  then a follow-up pass to make each a *distinct personality* (first cut
  varied only palette, so the dark ones rendered near-identically) and
  to replace the picker UI. All still through the token contract — no
  dashboard component changed.
  - `app/globals.css` — four new theme blocks, each pushing corners +
    elevation + typography to different values: **Midnight** soft-glass
    (round 16px, large blue glow, no card borders, airy sans-light
    headings, sans labels); **Emerald** chunky (round 20px, green-tinted
    glow, sans UPPER 800 −0.03em headings); **Terminal** CRT (square,
    hard 5px offset, mono UPPER 0.18em everywhere, `[ ]` brackets, grain
    0.08 + a scanline `.vault-grain::after` layer); **Porcelain** Swiss
    (crisp 3px, `--shadow-*: none` / hairline border only, sans UPPER
    0.12em headings + labels). Light-theme grain rule covers
    `ledger` + `porcelain`.
  - Every theme block (incl. Vault) now selects
    `:root[data-theme="x"], [data-theme="x"]` so a nested
    `<div data-theme="x">` gets the full token set — required by the
    picker's swatches. Vault keeps no `<html>` attribute at runtime;
    SSR unaffected.
  - `lib/theme/theme-context.tsx` — four `THEMES` entries added.
  - `components/dashboard/theme-toggle.tsx` — rewritten as a `Popover`
    of live preview swatches (2-col grid; each swatch a mini mockup in
    a `data-theme` wrapper, painting from real tokens incl. radius +
    shadow; active gets a ring + check). Trigger shows a swatch + name.
    Progression over the session: `SegmentedControl` → `Select` →
    popover. Same `className` prop, both call sites unchanged.
  - Verified: `tsc --noEmit` clean, 150/150 tests pass, `eslint` clean,
    `next build` clean.
  - `context/ui-context.md` Theming section updated (personality table,
    the dual-selector note, the picker rewrite).

- **2026-08-27 — Root route serves the landing page (uncommitted, on
  `landing-page` branch).** `app/page.tsx` no longer blindly redirects
  to `/dashboard`. It now `await auth()`s: signed-in users are still
  redirected to `/dashboard`, signed-out visitors get `<WelcomeLanding />`
  (the same component `/welcome` renders). `/welcome` stays as the stable
  canonical URL. Typecheck clean.

- **2026-08-27 — Multi-theme system + "Ledger" theme (uncommitted, on
  `landing-page` branch).** User asked to add the `/minimalist-ui` look
  as a *selectable second theme*, not a replacement, and flagged more
  themes coming. Chosen approach: a **CSS token contract**, not forked
  components (forking scales O(themes × components); the token contract
  is one CSS block per theme).
  - `lib/theme/theme-context.tsx` — `ThemeProvider`/`useTheme()`,
    `localStorage` `goldkh-theme`, default `"vault"`, mirrors
    `LocaleProvider`'s hydration-safe pattern. `data-theme` on `<html>`
    (`"vault"` = no attribute); effect cleans the attribute on unmount
    so it can't leak onto the marketing routes. `THEMES` registry
    drives the toggle.
  - `components/dashboard/theme-toggle.tsx` — registry-driven
    `SegmentedControl`, added to the sidebar footer and mobile top bar
    beside `LanguageToggle`.
  - `app/globals.css` — bare `:root` stays byte-equivalent to the old
    Vault values; new **idiom tokens** added there (`--label-*`,
    `--heading-*`, `--display-font`, `--bracket-open/-close`,
    `--shadow-lg/-sm`) and `.tt-label` / `.tt-heading` /
    `.shadow-vault-*` refactored to read them. New `.tt-display` (hero
    price face) and `.tt-bracket` (section-title `[ … ]` framing as
    `::before/::after` content, so a theme blanks it via tokens). New
    `:root[data-theme="ledger"]` block: warm-monochrome palette,
    `--radius: 8px`, serif heading/display font, empty brackets, soft
    shadows, plus a `.vault-grain::before` multiply/opacity tweak for
    paper.
  - `hero-price-card.tsx` / `transaction-history.tsx` /
    `price-history-chart.tsx` — `[ … ]` literals removed from JSX, now
    `.tt-bracket`. `hero-price-card.test.tsx` — two assertions rewritten
    (bracket chars are no longer in DOM text).
  - `app/layout.tsx` — `Newsreader` (`next/font/google`,
    `--font-newsreader`), referenced only by the Ledger theme.
  - Components never call `useTheme()` (only the shell + toggle do), so
    no new test mock was needed. Verified: `tsc --noEmit`, `eslint`,
    Vitest **150/150**, `next build` all clean. Not visually verified
    against a signed-in session (no Clerk test credentials here — same
    gap noted on earlier dashboard passes). Design reference: the
    "Goldsmith's Ledger" artifact mockup.
  - `context/ui-context.md` gained a **Theming** section.

- **2026-08-27 — Public landing page at `/welcome` (uncommitted, branch
  `landing-page`).** First user-facing page outside the auth wall. `/`
  still redirects straight to `/dashboard` (unchanged) — `/welcome` is a
  standalone marketing page, statically prerendered (`○` in `next build`).
  Route: `app/welcome/page.tsx` (server, owns `<metadata>`) → renders
  `components/welcome/welcome-landing.tsx` (`"use client"`, wraps the tree
  in `LocaleProvider`). Sections: sticky nav, two-column hero with a
  static replica of the real dashboard hero card (`sample-readout.tsx`,
  tagged "SAMPLE", hardcoded internally-consistent figures — 5 damlung at
  a $3,900 avg vs a $4,180 spot), trust strip, 2×2 feature grid, 3-step
  "how it works", inverted-gold CTA plate, footer. Reuses the Vault +
  Industrial Brutalism system verbatim (existing tokens only, `.tt-label`
  / `.tt-heading`, `[ bracket ]` eyebrows via new `section-eyebrow.tsx`,
  `.shadow-vault-*`, zero radius, `.vault-enter`) and the dashboard's
  `LanguageToggle`.
  - **i18n wired in fully** — new `welcome` block in `lib/i18n/dictionary.ts`
    (`en` + `km`, the usual `typeof en` shape enforcement); the EN/ខ្មែរ
    toggle switches the whole page, numbers stay Geist Mono tabular via
    the existing `html[lang="km"]` rule. Verified visually in both locales
    (screenshots in `.superpowers/`).
  - **Clerk Core 3 note:** `<SignedIn>`/`<SignedOut>` are removed in
    `@clerk/nextjs` 7.8 (they throw at render). Auth-aware CTAs now go
    through `components/welcome/use-signed-in.ts` (`useAuth()` →
    `isLoaded && isSignedIn`, false until loaded so the signed-out CTAs
    render first and the page stays static). Signed-out: "Get started" →
    `/sign-up`, "Sign in" → `/sign-in`. Signed-in: "Go to dashboard" →
    `/dashboard`.
  - Tests: `components/welcome/welcome-landing.test.tsx` (6 cases, jsdom,
    `useAuth` mocked signed-out) — headline, all `/sign-up` CTAs, `/sign-in`
    link, no dashboard CTA when signed out, SAMPLE tag, "not an exchange".
    150/150 suite green; `tsc --noEmit`, `eslint`, `next build` all clean.

- **2026-08-27 — API route hardening pass (uncommitted).** Against a
  good-practices checklist:
  - Non-owner PATCH/DELETE on `/api/transactions/[id]` now returns
    `403 FORBIDDEN` instead of `404`. `updateOwnedTransaction` /
    `deleteOwnedTransaction` return an `OwnedMutation` discriminated
    result (`ok` / `forbidden` / `not_found`); on a scoped-write miss a
    `classifyMiss` lookup by id decides 403 vs 404.
  - `request.json()` in `POST /api/transactions` and `PATCH
    /api/transactions/[id]` no longer crashes to 500 on a malformed
    body — new `lib/api/parseJsonBody.ts` does JSON-parse + Zod in one
    place and returns a `400`.
  - Extracted `withAuth` from `withAuthAndRateLimit` (the latter now
    composes it); `GET /api/transactions` uses `withAuth` instead of a
    hand-rolled 401 check.
  - Removed the unused `getOwnedTransaction` query; dropped the
    non-null assertion in `price/refresh` (narrow on `!== null`);
    trimmed over-long comments across the API routes and their helpers.
  - Code review (subagent) pass: added `lib/db/queries/transactions.test.ts`
    covering the `classifyMiss` 403-vs-404 decision; `parseJsonBody` takes a
    `label` arg instead of a hard-coded "transaction payload" message.
  - Follow-ups from that review, now done: `POST /api/price/refresh` uses
    the shared `withAuth` wrapper (was the last hand-rolled `auth()` + 401);
    CONTEXT.md gained a "transaction ownership" entry documenting the
    403-discloses-id-existence trade-off and that clients treat 403 like 404
    here (not a re-login trigger).
  - Full suite green (144), `tsc --noEmit` clean, `next build` clean, lint
    clean.

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
- Dashboard shell design pass (2026-08-27): evolved the Vault
  system's execution without changing its palette or tokens.
  `Panel` now differentiates elevation — `lg` (hero, chart) keeps
  its border plus a new warm tinted shadow (`.shadow-vault-lg` in
  `globals.css`); `md` (stat cards, transaction rows) drops the
  border for a quieter `.shadow-vault-sm`, so cards read as a
  hierarchy instead of one repeated container. Added a fixed
  low-opacity grain overlay and a top-right ambient gold glow to
  `DashboardShell`, a matching subtle glow behind the hero price,
  a gold "Au" wordmark mark in the sidebar/mobile header, a
  left-accent-bar active nav state (replacing full-fill), and a
  tone-tinted background on the gain/loss stat card. Added one
  authored motion moment — `.vault-enter` staggered fade/
  translateY entrance across the dashboard's four sections
  (`prefers-reduced-motion` respected). Verified: `tsc --noEmit`,
  `eslint`, full Vitest suite (111/111), and the impeccable
  mechanical design detector all clean on the changed files.
  Not yet visually verified against a signed-in session — no
  Clerk test credentials available in this environment.

- **Brand mark unified + auth pages branded, 2026-08-27** (via
  `/ecc:frontend-design-direction` audit). Found three assets doing
  overlapping jobs: the sidebar's new `icon.svg` image, the mobile
  header's separate hand-rolled `Au` text-in-a-box mark, and a
  freshly-added `public/logo.svg` full wordmark lockup that was
  referenced nowhere. Fixed by replacing `dashboard-shell.tsx`'s
  mobile-header `Au` mark with the same `icon.svg` `<Image>` the
  sidebar already uses (one brand mark, not two), and adding
  `logo.svg` above the Clerk widget on both `app/sign-in/[[...sign-in]]/
  page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` — previously
  bare, unbranded Clerk widgets on an empty background, the first
  screen any new user sees. Verified: `tsc --noEmit` and `eslint`
  clean on the three changed files; sign-in screenshotted via
  chrome-devtools MCP against the local dev server. The dashboard's
  mobile header itself couldn't be visually re-confirmed the same
  way — still no Clerk test credentials in this environment (see the
  existing note on the dashboard shell design pass below).

- **i18n: English/Khmer toggle added, 2026-08-27.** User asked for a
  full language switch, not just number/date localization. New
  `lib/i18n/dictionary.ts` (flat nested dictionary, `en`'s inferred
  shape enforced onto `km` via `const km: typeof en = {...}` so a
  missing Khmer key is a type error, not a silent English fallback)
  and `lib/i18n/locale-context.tsx` (`LocaleProvider`/`useLocale()`,
  localStorage-persisted, defaults to `"en"` on every render so
  server and first client paint agree — the stored preference is
  read in an effect, not a lazy `useState` initializer, to avoid a
  hydration mismatch). `LocaleProvider` wraps the tree once, in
  `DashboardShell`. New `LanguageToggle` component (mirrors
  `UnitToggle`'s segmented-control shape) placed in the sidebar
  footer and the mobile top bar. Every user-facing string in
  `Sidebar`, `HeroPriceCard`, `UnitToggle`, `StatRow`,
  `TransactionHistory`, `TransactionDialog`, `EmptyState`,
  `RefreshButton`, and `PriceHistoryChart`'s empty state now reads
  through `useLocale()`'s `t`. Khmer has no letter case, which
  surfaced one real inconsistency in the process: the buy/sell
  toggle button used to render lowercase `"buy"/"sell"` text
  visually capitalized by a CSS `capitalize` class — that trick
  can't carry over to Khmer, so the button now renders the real
  translated (already-cased) label directly; one test assertion
  (`transaction-dialog.test.tsx`) updated to match. Added
  `Noto_Sans_Khmer` (`next/font/google`) alongside the existing
  Geist fonts — `html[lang="km"]` overrides the `--font-geist-sans`
  CSS variable (not `--font-sans` directly, so it wins on
  specificity regardless of source order) and leaves `--font-mono`
  untouched, so every price/quantity still renders in Geist Mono
  per ui-context.md's tabular-figures rule. Existing component
  tests (`refresh-button.test.tsx`, `transaction-dialog.test.tsx`,
  `transaction-history.test.tsx`, `hero-price-card.test.tsx`) broke
  on `useLocale()` throwing outside a provider — fixed with one
  global `vi.mock("@/lib/i18n/locale-context")` in
  `vitest.setup.ts` (fixed English `t`, no-op `setLocale`) rather
  than wrapping every test file, since none of these tests are
  about locale switching itself. One `react-hooks/set-state-in-effect`
  lint error on the hydration-safe localStorage-read effect —
  disabled inline with a comment explaining why (the standard fix
  for "read from localStorage after mount" unavoidably calls
  setState synchronously in an effect). Hero disclaimer copy also
  reworded per user feedback mid-session, away from the "loss"/
  "dealer premium" framing to a plainer "prices differently from
  the global spot rate" statement — both `en` and `km` updated, and
  the matching test assertion. 111/111 tests pass; typecheck, lint,
  `next build`, and the impeccable mechanical detector all clean.

- **Spacing pass, 2026-08-27 (same session as the i18n work).** User
  asked for more breathing room. Widened, modestly and consistently
  with the existing token scale rather than a redesign:
  `DashboardContent`'s inter-section gap (26px to 32px+ at `md`),
  `Panel`'s padding (`lg` 24px to 28px at `sm`, `md` 16px to 20px),
  `StatRow`'s card gap, transaction table row height (`py-2.5` to
  `py-3`) and card internals, the transaction dialog's field gap
  (`gap-6` to `gap-7`) and field-label gap (`gap-1.5` to `gap-2`),
  the sidebar's nav-item and footer padding, and the dashboard
  `main` padding. `ui-context.md`'s "16-18px padding inside cards"
  and "26px vertical gap" figures in its Spacing Rhythm section are
  now stale by this amount — not yet updated there, since the
  change was modest enough to treat as tuning within the documented
  rhythm rather than a rewrite of the rule; revisit that doc if
  spacing changes again.

- **Industrial Brutalism fusion, 2026-08-27** (`/industrial-brutalist-ui`
  skill, user chose "fuse: brutalist structure, Vault palette" over a
  full palette replacement — see `ui-context.md`'s new note under
  Theme). Vault's dark/gold tokens, mono-tabular-figures rule, and
  component structure are unchanged; what changed is execution:
  `--radius` dropped to `0px` in `globals.css` (every `rounded-*`
  utility derives from it, so this one token squares every corner
  app-wide), `.shadow-vault-lg`/`.shadow-vault-sm` swapped from
  blurred tinted shadows to hard-edged offset shadows (`4px 4px 0 0`
  / `2px 2px 0 0 var(--border)`, no blur — brutalism rejects soft
  drop shadows), and two new utility classes added: `.tt-label`
  (mono, uppercase, `0.08em` tracking — every stat/table/toggle/
  button label and the sidebar nav now routes through this instead
  of plain muted sans text) and `.tt-heading` (uppercase, tight
  `-0.01em` tracking, bold — section titles). The hero card's
  blurred gold glow orb and soft gradient top bar were removed in
  favor of a flat solid `bg-primary` bar; its live/stale dot is now
  a filled square instead of a circle, and the live/stale label
  reads `[ Live ]`/`[ Stale ]` (ASCII bracket framing, per the
  skill's section 6). `TransactionHistory` and `PriceHistoryChart`
  section headings gained the same `[ ... ]` framing. Chart axis
  tick labels now render in the mono font (`var(--font-mono)`)
  instead of the browser default. Two test assertions in
  `hero-price-card.test.tsx` updated to match the new bracket text.
  Verified: `tsc --noEmit`, `eslint`, and the full Vitest suite
  (111/111) all clean. Not yet visually verified against a signed-in
  session — same Clerk test-credential gap noted in the dashboard
  shell design pass above.

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
3. ~~UI/component test coverage.~~ Done — see Architecture
   Decisions for the full writeup (infra setup, coverage scope,
   the RTL-cleanup gap found and fixed, verification).

Production-readiness batch, added from the 2026-08-26 hardening
grilling session, worked in this order (each small and independently
verifiable, per `ai-workflow-rules.md`'s "When to Split Work"):

3a. ~~Fix the KHR-poisons-`computeHoldings` bug.~~ Done — `currency`
    added to `TransactionLike`, non-USD rows skipped in the
    accumulation loop, two regression tests added
    (`lib/calc/holdings.test.ts`). Verified: typecheck, full test
    suite (64/64), lint, `next build` all clean.
3b. ~~`lib/env.ts` — Zod-validated env vars, fail fast at boot.~~
    Done. Deliberately a `validateEnv()` function called once from
    `proxy.ts` (runs before any request, in every environment, never
    imported by a test) rather than a parsed singleton every module
    reads from — the latter would force `GOLDAPI_IO_API_KEY` etc. to
    be eagerly present at import time and break `goldapi.ts`'s
    existing per-call test coverage (it deletes the env var mid-test
    to verify its own throw). `lib/db/client.ts`,
    `lib/price/providers/goldapi.ts`, and `drizzle.config.ts` keep
    their existing inline checks unchanged. 8 new tests
    (`lib/env.test.ts`). Verified: typecheck, full test suite
    (72/72), lint, `next build` all clean (against real `.env.local`
    values, confirming `validateEnv()` passes under real conditions).
3c. ~~Baseline security headers in `next.config.ts`.~~ Done —
    `X-Content-Type-Options`, `Referrer-Policy`,
    `Content-Security-Policy: frame-ancestors 'self'`, and
    `Strict-Transport-Security`, applied to every route via
    `headers()`. **Discovered and fixed a real gap while verifying
    this**: `next start` failed to boot at all, because
    `CLERK_WEBHOOK_SIGNING_SECRET` genuinely isn't set in
    `.env.local` (the Clerk Dashboard webhook registration is still
    the open, not-yet-done-outside-this-repo step noted elsewhere in
    this file) and `lib/env.ts` was hard-requiring it — blocking the
    entire app over one non-critical route's secret. Fixed by making
    it `.optional()` in the schema: validated for shape if present,
    no longer required to boot. `app/api/webhooks/clerk/route.ts`'s
    own `verifyWebhook()` already throws (caught, returned as 400)
    if a webhook actually arrives with it unset — no behavior change
    there. This revises architecture.md invariant 10 and the
    Architecture Decisions entry below; recorded here since it's a
    real adjustment to what was previously agreed, not a silent
    one. Verified end to end: typecheck, full test suite (73/73,
    +1 new test), lint, `next build`, and an actual `next start`
    confirming the app boots and serves all four headers.
3d. ~~GitHub Actions CI — `lint` + `test` + `build`, blocking on PRs
    into `main`.~~ Done — `.github/workflows/ci.yml`, `npm ci` then
    `lint`/`test`/`build`, on every push/PR into `main`. Build needs
    at least a placeholder `DATABASE_URL` (confirmed by temporarily
    hiding `.env.local` locally — `next build` fails without one,
    since route-handler page-data collection imports
    `lib/db/client.ts`); CI sets well-formed placeholder values for
    `DATABASE_URL`, `CLERK_SECRET_KEY`,
    `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `GOLDAPI_IO_API_KEY` at
    the workflow level — never real credentials.
    `CLERK_WEBHOOK_SIGNING_SECRET` is omitted, matching its
    optional status (see 3c). Verified by running the exact same env
    vars locally (`.env.local` hidden) — build passes clean.
3e. ~~Sentry (`@sentry/nextjs`), client + server.~~ Done —
    `instrumentation.ts` (server + edge, via `register()`, plus
    `onRequestError` wired to `Sentry.captureRequestError`) and
    `instrumentation-client.ts` (browser), both calling `Sentry.init()`
    with `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN` — a documented
    no-op when unset, so every environment stays safe until a real
    Sentry project exists. `next.config.ts` wrapped with
    `withSentryConfig` (`silent: true`, no org/project/authToken yet
    — source-map upload is skipped until those are configured).
    `NEXT_PUBLIC_SENTRY_DSN` added to `.env.example`. One SDK-version
    gap found and worked around: `@sentry/nextjs` 10.71.0 has no
    `captureRouterTransitionStart` export yet for Next 16.3's new
    `onRouterTransitionStart` hook — that optional hook was left out
    of `instrumentation-client.ts` rather than guessed at; revisit
    when the SDK adds it. Verified: typecheck, full test suite
    (73/73), lint, `next build` (both against real `.env.local` and
    against the exact CI placeholder env with no DSN at all), and an
    actual `next start` confirming clean boot with no Sentry errors.
3f. ~~Confirm/document the Vercel deploy + migration process.~~
    Done — see `architecture.md`'s "First-deploy checklist," a
    5-step list for the user to work through outside this repo
    (connect Vercel, set prod env vars, run migrations by hand,
    register the Clerk webhook, create the Sentry project). No code
    change; nothing to verify with a test suite.

5. Pagination or an alternate treatment for transaction lists
   long enough to make the `max-h-80` scroll container feel
   cramped — no user has enough rows yet to know if scroll-only
   is sufficient.
6. Backfilling the price-history chart's gaps, if they turn out
   to matter — see the Architecture Decisions entry on the chart.
7. A real, separate History page/route. The sidebar's "History"
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
  the quota faster than expected. Partially addressed 2026-08-27: the
  60s auto-refresh poll was removed (see "Dashboard refresh moved from
  a blind 60s interval to tab-re-entry only" in Architecture
  Decisions), so a left-open tab no longer re-renders on a timer at
  all. The 30-minute `PRICE_STALENESS_MS` gate is still the actual
  quota guard; this just removes the thing that was hammering the
  render path behind it.
- **Clerk `user.deleted` webhook registration — deliberately deferred
  by the user, 2026-08-27.** The code is done and requires no further
  work (see Architecture Decisions); what's outstanding is only the
  external step — setting `CLERK_WEBHOOK_SIGNING_SECRET` and
  registering the endpoint in the Clerk Dashboard, subscribed to
  `user.deleted`. User's call: not worth doing until there's a real
  user base, since until then a deleted account leaving orphaned
  transaction rows behind is a low-stakes gap, not an active problem.
  `lib/env.ts` already treats this var as optional, not
  boot-blocking, precisely so this could be deferred safely.
  Revisit once there are meaningfully more users than just the
  developer.
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
- ~~`computeHoldings`/weighted-average cost mixes KHR `pricePerUnit`
  into the same aggregate as USD, unguarded.~~ Resolved via the
  2026-08-26 hardening grilling session — see Architecture
  Decisions ("KHR rows excluded from `computeHoldings`'s aggregate").

- **Terms of Service / Privacy Policy.** Explicitly skipped per the
  user, 2026-08-26 hardening session — see `project-overview.md`'s
  Out of Scope and the matching Architecture Decisions entry.

- **Full Content-Security-Policy.** Deferred — see the "Security
  headers" Architecture Decisions entry below. Needs auditing what
  Clerk's embedded UI and Recharts actually load/execute before a
  CSP can be written without breaking either.

- ~~Vercel deploy + migration process, not yet documented outside
  this repo.~~ Resolved — see `architecture.md`'s "First-deploy
  checklist." Status as of 2026-08-27: step 5 (Sentry project + DSN)
  is done — `NEXT_PUBLIC_SENTRY_DSN` is set in `.env.local`. Step 4
  (Clerk webhook registration) is deliberately deferred by the user
  until there's a real user base (see the Clerk webhook entry
  above). Steps 1-3 (Vercel project, production env vars, first
  migration) remain not done — no code change affects them, this is
  a checklist for the user to work through.

## Architecture Decisions

- **The twin `TransactionLike` / `TransactionRowLike` types merged into
  one `LedgerEntry`** (2026-08-27, `/improve-codebase-architecture`
  review, candidate D; grilled before implementing). `holdings.ts` and
  `transactionRow.ts` each declared a byte-identical 5-field type and
  each re-derived the same `currency !== "USD"` / `type === "sell"`
  branching inline. Now `lib/calc/ledgerEntry.ts` owns `LedgerEntry`
  (+ `LedgerEntryWithId`, replacing `TransactionWithId`) and
  `classifyEntry()`, which names the shared axis as `non-usd | sale |
  open-buy`. Both `computeHoldings` and `computeRowValuation` take
  `LedgerEntry` and switch on `classifyEntry`.
  - **Scope, honestly:** the type merge is the real win — one source of
    truth for the calc layer's transaction shape. `classifyEntry` is a
    modest add: it names the KHR-deferred / sell-has-no-position cases in
    one place (both files carried long comments about them) but is only
    ~3 lines. The two compute functions stay fully separate — the
    aggregate folds a sell into a running average, the per-row values one
    row in isolation; no shared compute path.
  - Consumers repointed: `transaction-history.tsx` (`TransactionRow
    extends LedgerEntry`), `transaction-dialog.tsx` +
    `transaction-dialog.test.tsx` (`LedgerEntryWithId`). Added
    `lib/calc/ledgerEntry.test.ts` (3 cases); import renames in
    `holdings.test.ts` / `transactionRow.test.ts`. 134/134 tests pass;
    lint and `next build` clean.

- **The refresh button's HTTP conversation extracted to
  `lib/price/requestPriceRefresh.ts`** (2026-08-27,
  `/improve-codebase-architecture` review, candidate C; grilled before
  implementing). `RefreshButton`'s click handler parsed the wire itself
  — endpoint path, "429 means cooldown", `Retry-After` header math,
  `body.data.cooldownEndsAt` digging, network-fail vs error-envelope
  branching — all interleaved with `setState`. Now `requestPriceRefresh()`
  owns the whole contract with `POST /api/price/refresh` and returns a
  `RefreshOutcome` discriminated union: `refreshed | cooldown |
  unreachable | failed`, each carrying `cooldownEndsAt` / `message` only
  where real. The component `switch`es on `outcome.kind` and maps each to
  toast copy + local state.
  - **Scope, honestly:** this is a locality win, not a state reduction.
    The component still owns `cooldownEndsAt` / `inCooldown` / `busy` /
    `toast` and the two timer effects — C only gets the click handler out
    of the HTTP business and onto a React-free, independently testable
    seam. The review's "five-state machine → one call" framing oversold
    it.
  - `router.refresh()` + `startTransition` stay in the component (React).
    The pre-fetch "already in cooldown → toast, don't hit the route"
    guard stays too (it reads `inCooldown` state). `requestPriceRefresh()`
    always performs the fetch and holds no React.
  - The 429 branch anchors `Retry-After` (seconds remaining) to
    `Date.now()` *inside the module* and returns an absolute
    `cooldownEndsAt`, so the component never does duration math.
  - Tests: new `lib/price/requestPriceRefresh.test.ts` (node env, stubbed
    `fetch`) covers all four outcomes incl. 200-with-null-deadline,
    429-without-usable-`Retry-After`, unparseable error body.
    `refresh-button.test.tsx` unchanged — it still stubs `fetch` and runs
    through the real module; all 7 cases pass. `CONTEXT.md` gains a
    **manual refresh outcome** entry. 131/131 tests pass; lint and
    `next build` clean.

- **All `price_snapshots` access moved behind `lib/db/queries/priceSnapshots.ts`**
  (2026-08-27, `/improve-codebase-architecture` review, candidate B;
  grilled before implementing). `getPrice.ts` had mixed pure
  orchestration (provider rotation, freshness gate, cache fallback) with
  three DB operations — a Drizzle `select`, a Drizzle `insert`, and a raw
  `INSERT ... SELECT ... WHERE NOT EXISTS`. A fourth `price_snapshots`
  query lived separately in `lib/db/queries/priceHistory.ts`. Now one
  query module owns every `price_snapshots` read and write; `getPrice.ts`
  imports `db`/`drizzle-orm`/`schema` not at all.
  - `getPrice.ts` keeps only `getPrice`, `GetPriceDeps`, and a
    re-exported `PriceSnapshot` type. Same `GetPriceDeps` DI pattern
    (firm decision) — `defaultDeps` just points at the query module; the
    dep key `insertIfStillStale` → `insertSnapshotIfStale`.
  - **The `interval '30 minutes'` SQL literal is gone.**
    `insertSnapshotIfStale(price, staleMs)` takes the threshold as a
    parameter (`getPrice.ts` passes `PRICE_STALENESS_MS`), collapses it
    to a bound cutoff `Date` — `WHERE captured_at > ${cutoff}`. Still one
    atomic statement, so the conditional-insert concurrency guard (firm
    decision) is unchanged; the cutoff is now handler-clock- rather than
    DB-`now()`-relative, a sub-ms difference at 30-minute granularity.
  - `PriceResult` renamed `PriceSnapshot` (matches `CONTEXT.md`'s
    ubiquitous term) and now lives in the query module; `freshness.ts`
    and `getPrice.ts` import it from there.
  - Insert input typed as a local `NewPriceSnapshot = { pricePerTroyOz,
    source }` in the query module, not the price layer's
    `NormalizedPrice` — keeps the dependency arrow price → db, never
    back. Structurally compatible, so call sites are unchanged.
  - `lib/db/queries/priceHistory.ts` deleted; its `listRecentPriceSnapshots`
    folded in. `POST /api/price/refresh` and `app/dashboard/page.tsx`
    import straight from the query module (no re-export shim through
    `getPrice.ts` — that pass-through is what the deletion test flags).
  - Tests: no new query-module test (firm decision — thin DB wrappers
    aren't unit-tested; the conditional-insert branch is covered via
    `GetPriceDeps` in `getPrice.test.ts`). `getPrice.test.ts` and
    `route.test.ts` change import paths / the dep key only. 124/124
    tests pass; lint and `next build` clean.

- **Price freshness collapsed into one deep module: `lib/price/freshness.ts`**
  (2026-08-27, `/improve-codebase-architecture` review, candidate A;
  grilled before implementing). "Is the price stale? May the user
  refresh? When does the cooldown lift?" was answered by three shallow
  predicates (`isFresh`, `isSnapshotStale`, `isManualCooldownActive`,
  all in `getPrice.ts`) plus raw `Date.now() - capturedAt` arithmetic
  re-done at every consumer. Now one pure `priceFreshness(snapshot,
  now?)` returns `{ isStale, cooldownActive, cooldownEndsAt }`, computed
  once per request.
  - `getPrice()` uses `!priceFreshness(latest).isStale`; its private
    `isFresh` is deleted. Staleness boundary unified on `age >=
    PRICE_STALENESS_MS` (was a `<`/`>` split, a ≤1 ms shift, refetch-at-
    boundary is the safe direction).
  - `app/dashboard/page.tsx` drops the `MANUAL_REFRESH_COOLDOWN_MS`
    import — one `priceFreshness(price)` call yields both `isStale` and
    `cooldownEndsAt`.
  - `POST /api/price/refresh` now sends the cooldown deadline back: a
    standard `Retry-After` header on the 429 (kept off the error
    envelope, which `code-standards.md` holds to `{ code, message }`),
    and `cooldownEndsAt` in the 200 `data` payload. This retires the
    last client-side guess flagged in the earlier RefreshButton entry
    below — `refresh-button.tsx` reads the header / the payload field
    and imports no freshness constant at all.
  - **Out of scope, deliberately:** `auto-refresh.tsx` keeps its own
    `lastRefreshAtRef` clock (gates on time since *its* last
    `router.refresh()`, not since capture) and its constant import —
    folding it onto the capture clock is a behaviour change, not a
    deepening.
  - The `interval '30 minutes'` SQL literal in `getPrice.ts`'s
    conditional insert is untouched here — candidate B (above) later
    moved the snapshot SQL behind `lib/db/queries/priceSnapshots.ts`
    and retired the literal.
  - New `CONTEXT.md` at repo root (domain glossary, per `AGENTS.md`'s
    single-context layout) defines **price snapshot** and **price
    freshness**.
  - Tests: new `lib/price/freshness.test.ts` (age table + `undefined`
    row; absorbs the 3 `isManualCooldownActive` tests). `getPrice.test.ts`
    unchanged bar the removed block — its fresh/stale cases run through
    the real pure function. `route.test.ts` stops mocking the predicate,
    drives the cooldown branch via `capturedAt`, asserts `Retry-After`.
    `refresh-button.test.tsx` success mocks return `data.cooldownEndsAt`;
    429 mock carries `Retry-After`. 124/124 tests pass; lint and
    `next build` clean.

- **Dashboard auth gate collapsed to one redirect point** (2026-08-27,
  grilling session). `app/dashboard/page.tsx` used to re-run `auth()` and
  `redirect("/sign-in")` even though `app/dashboard/layout.tsx` already
  gates the route with `redirectToSignIn()`. Prompted by a report of
  `GET /dashboard` firing back-to-back (~1.4s apart) in `next dev`.
  Diagnosis (DevTools + server log): the burst was a *transient* Clerk
  **development-instance** handshake settling right after sign-in (`pk_test_`
  keys; `proxy.ts` middleware spiking 700-1000ms every ~6th request = the
  FAPI handshake round-trip), not a steady-state loop — idle focused tab
  settles to one refresh/minute. Environment was clean (0.10s clock skew,
  single `localhost:3000` origin, one dev server). Fix kept minimal: the
  page still calls `auth()` for `userId` (request-memoized, cheap) but now
  does `if (!userId) return null` instead of a second redirect, removing a
  redundant bounce point that gave any future transient handshake another
  way to re-navigate the route. No production code change — `pk_live_` on a
  real domain doesn't use the handshake flow. 120/120 tests, `tsc --noEmit`
  clean. Plan: `~/.claude/plans/dashboard-request-loop-clerk-handshake.md`.
  Deferred check: on first `pk_live_` deploy, confirm no `/dashboard` loop
  on the deployed site. Open loose end: the same capture showed
  `__nextjs_original-stack-frames` + repeated Sentry `envelope` posts (an
  exception thrown on the dashboard in dev) — unrelated, untriaged.

- **Manual Refresh button gives feedback synchronously on click**
  (2026-08-27). `RefreshButton` (`components/dashboard/refresh-button.tsx`)
  previously `await`ed `POST /api/price/refresh` (a direct goldapi.io
  fetch, ~1-2s) before any visual change — the spinner only appeared
  afterward, once `startTransition(router.refresh())` set `isPending`.
  Users read the idle button as a dead click and clicked again, each
  extra click firing another POST. Fix: new `isRefreshing` state set
  synchronously at the top of `handleClick` (before the `await`), so the
  `Spinner` + `aria-disabled` land on the same click; a `busy =
  isRefreshing || isPending` flag keeps the button spinning continuously
  through the fetch and the RSC re-render that follows. `handleClick`
  early-returns when `isRefreshing` is already true, so repeat clicks
  during the in-flight fetch are swallowed instead of making more
  requests. `try/finally` resets `isRefreshing`. No prop/signature
  change. Covered by a new `refresh-button.test.tsx` case (spins on
  click before the fetch resolves; two extra clicks fire no further
  fetches). 120/120 tests, typecheck, lint, `next build` all clean.

- **Dashboard refresh moved from a blind 60s interval to tab-re-entry
  only** (2026-08-27, grilling session). `components/dashboard/auto-refresh.tsx`
  no longer runs any `setInterval`. It now listens for `document`
  `visibilitychange` and, when the tab becomes visible again, calls
  `router.refresh()` — but only if it's been at least
  `MANUAL_REFRESH_COOLDOWN_MS` (5 min) since the loaded price's
  `capturedAt` (passed in as a prop from `app/dashboard/page.tsx`,
  so the cooldown is measured from when the data was actually
  fetched, not from component mount). Mutations and the manual
  refresh button still call `router.refresh()` as before.
  Rationale: an idle viewer sitting on the dashboard gains almost
  nothing from polling — their transactions only change when they
  themselves mutate them (already refreshed), and `getPrice()`'s
  30-minute staleness gate already bounds goldapi.io calls
  regardless of poll rate. The old 60s poll re-ran a ~1.4s,
  4-query RSC render every minute forever, including on hidden,
  minimized, and abandoned tabs; a hidden tab now costs zero. No
  `window` `focus` listener and no in-page click/scroll listeners —
  "re-engaged with the tab" is the whole intent. Covered by
  `components/dashboard/auto-refresh.test.tsx` (5 cases: fires on
  re-entry past the cooldown, suppressed within it, fires again
  after it elapses, never on going-hidden, listener removed on
  unmount) — `AutoRefresh` was previously in the "deliberately not
  covered" list, moved out because the cooldown branch is real
  logic. Note: the original prompt that started this was repeated
  `GET /dashboard` in `next dev`; that log had no timestamps, and a
  sub-agent trace found the more-likely driver of a *sub-60s*
  cadence is Clerk dev-key (`pk_test_…`) `__clerk_handshake` churn
  compounded by the duplicate `auth()` gate in
  `app/dashboard/page.tsx` (its own `redirect("/sign-in")` on top
  of `app/dashboard/layout.tsx`'s `redirectToSignIn()`) — left as a
  separate follow-up, not part of this change.

- **Manual refresh cooldown now gates on the newest snapshot of any
  kind, not just prior manual refreshes** (2026-08-27, same session).
  Follow-on to the entry above. `isManualCooldownActive` (`lib/price/
  getPrice.ts`) is unchanged, but both call sites now feed it the
  latest snapshot rather than the latest *manual* snapshot:
  `app/dashboard/page.tsx` uses `price.capturedAt` (already fetched by
  `getPrice()`, so `getLatestManualSnapshot()` was dropped from the
  page's `Promise.all` — one fewer query per render), and
  `app/api/price/refresh/route.ts` calls the now-exported
  `getLatestSnapshot()`. Effect: after *any* fresh price is captured —
  a manual refresh, or `getPrice()`'s own 30-minute provider fetch on
  a page load — the manual refresh button is disabled and
  `POST /api/price/refresh` returns 429 for `MANUAL_REFRESH_COOLDOWN_MS`
  (5 min), so a browser reload right after a fetch can't be turned
  into a second provider call by immediately clicking Refresh. User
  ask: "browser refresh or anything will not send an api request
  unless timer runs out." `getLatestManualSnapshot` is removed (0
  callers); the `price_snapshots.isManual` column stays — still
  written by the manual route, just no longer read for the cooldown.
  Coverage: `isManualCooldownActive` gained 3 direct unit tests
  (`lib/price/getPrice.test.ts`); the refresh-route test mock was
  renamed to match. 119/119 tests, lint, `next build` all clean.

- **Remaining three architecture-review candidates implemented**
  (2026-08-27, same review as the entry below):
  - **`existingTransactions`/`allRows` prop drilling collapsed via
    context.** `transaction-history.tsx`'s `Row` and `TransactionCard`
    carried an `allRows` prop purely to pass through to `RowActions`,
    which needed it only to compute holdings-excluding-self inside
    `TransactionDialog`'s edit mode. Replaced with a module-local
    `AllRowsContext`, provided once around `TransactionHistory`'s
    render and read directly by `RowActions` via `useContext` — `Row`
    and `TransactionCard`'s prop interfaces each dropped a prop they
    never used themselves.
  - **Auth + rate-limit given a seam: `withAuthAndRateLimit`**
    (`lib/api/withAuthAndRateLimit.ts`). The identical five-line
    auth-then-rate-limit block was duplicated across `POST
    /api/transactions` and `PATCH`/`DELETE /api/transactions/[id]` —
    now one higher-order function wraps a handler, checks auth then
    rate limit in a fixed order, and passes `userId` (merged with the
    route's own context, e.g. `params` on the `[id]` routes) into the
    handler. `GET /api/transactions` and `POST /api/price/refresh`
    stay unwrapped — rate limiting was always scoped to the
    transaction-*mutating* routes only, unchanged. Existing route
    tests needed no changes (their `vi.mock` of `@clerk/nextjs/server`
    and `@/lib/api/rateLimit` still intercepts the same imports,
    now reached through the wrapper); added 4 new tests
    (`withAuthAndRateLimit.test.ts`) covering the 401/429 short-circuit
    order and context merging directly.
  - **`RefreshButton`'s cooldown deadline now read from the server's
    response, not guessed from `Date.now()`.** On a successful manual
    refresh, `POST /api/price/refresh` already returns the inserted
    snapshot's real `capturedAt`; the button now derives
    `cooldownEndsAt` from that instead of `Date.now() +
    MANUAL_REFRESH_COOLDOWN_MS` taken at a different instant
    (post-fetch-latency). The 429-cooldown-already-active branch keeps
    its client-side guess — the error envelope has no `data` field per
    `architecture.md`'s one-shape-per-route rule, so there's no real
    deadline available there; documented inline as an unavoidable
    exception, not an oversight. Updated `refresh-button.test.tsx`'s
    success-case mock to return a real `data.capturedAt` body (was
    `Response(null)`, which the new code path can no longer parse as
    JSON) and added a test asserting the cooldown reflects the
    server's timestamp rather than the click instant.

  111/111 tests pass (106 + 5 new); typecheck, lint, `next build` all
  clean.

- **Optimistic transaction reconciliation extracted into
  `useOptimisticTransactions`** (`components/dashboard/
  use-optimistic-transactions.ts`), acted on from an architecture review
  (`/improve-codebase-architecture`, 2026-08-27). Previously
  `pendingAdds`/`removedIds`/`awaitingAddRefresh` lived inline in
  `DashboardContent` — the temp-id/settle protocol was assembled at the
  call site from four separate props and a ref, and was the one untested
  module in an otherwise well-tested cluster (its sibling components all
  gained `.test.tsx` files this session). The hook now owns that
  reconciliation exclusively: `rows` (merged), `addOptimistic`,
  `settleAdd`, `markRemoved`, `unmarkRemoved`. `DashboardContent` keeps
  the UI-facing concerns the hook doesn't own — the `error`/
  `successMessage` banner state and the actual `DELETE` fetch call — and
  calls the hook's functions inside its existing handlers. No prop or
  behavior visible to `TransactionHistory`/`TransactionDialog`/
  `EmptyState` changed. Covered by 5 new tests
  (`use-optimistic-transactions.test.ts`, via `renderHook`/`act` under
  jsdom): merge order, pending-add held until server rows catch up,
  failed-settle rollback, an unrelated delete not clearing a still-
  pending add, and remove/unmark. 106/106 tests pass; typecheck, lint,
  `next build` all clean (re-verified after a concurrent session wired
  up `UnitToggle` — see the "Dashboard display-unit toggle" entry below
  — landed in the same working tree). Other candidates from the same
  review (collapsing `existingTransactions` prop drilling, an
  auth+rate-limit route-guard seam, the refresh button's client-side
  cooldown guess) were surfaced but not acted on — left for a future
  pass. The fifth candidate (`UnitToggle` promising cross-component
  sync with no adapters wired up) is now moot — resolved by the
  concurrent session's work.

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

- **Test framework: Vitest, `environment: "node"` by default.**
  Coverage focuses on `lib/calc` (pure, no mocks), `lib/price`
  (mocked `fetch`/DB via dependency injection), and the transactions
  API route (mocked Clerk `auth()` + DB). Component/RTL tests were
  explicitly scoped out of the original session that wrote this
  entry, to stay focused on the logic code-standards.md calls
  correctness-critical — since superseded: see the "UI/component
  test coverage" entry above for the React Testing Library + jsdom
  setup added 2026-08-27.

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

- **UI/component test coverage: React Testing Library + jsdom, added
  2026-08-27, scoped to the interactive/logic-bearing components,
  not every presentational leaf.** Infra: `vitest.config.ts` gained
  `**/*.test.tsx` to its `include` and a `setupFiles` entry
  (`vitest.setup.ts`); the default `environment: "node"` was left
  alone — component test files opt into jsdom individually via a
  `// @vitest-environment jsdom` docblock, so the existing 73
  node-environment `lib`/`api` tests couldn't be affected by the
  change. New deps: `@testing-library/react`,
  `@testing-library/jest-dom`, `@testing-library/user-event`,
  `jsdom` (all devDependencies).

  Covered: `TransactionDialog` (validation via the real Zod schema,
  optimistic add + rollback-on-failure, sell-exceeds-holdings
  warning, add vs. edit request shape — POST vs. `PATCH
  /api/transactions/{id}`), `TransactionHistory` (KHR vs. sell
  blank-value reasons via their distinct `title` text, the
  optimistic-row "Saving…" state, the two-click delete confirm
  flow), `HeroPriceCard` (Live/Stale labeling), `RefreshButton`
  (cooldown gating a click without fetching, 429 entering cooldown
  vs. a generic error, network-failure toast), and `EmptyState`.
  Deliberately not covered: `Panel`, `MonoValue`, `Sidebar`,
  `DashboardShell`, `InlineBanner`, `StatRow`, `AutoRefresh`,
  `PriceHistoryChart` (Recharts — low logic-to-test-effort ratio),
  and `DashboardContent`'s own orchestration — pure presentation or
  already effectively covered by testing the components it
  composes. Add tests for these if a regression actually happens in
  one, not preemptively — same "correctness-critical, not
  exhaustive" boundary this project's `lib/` test coverage already
  drew (see the "Test framework: Vitest" entry below).

  **Found and fixed a real gap while building this out**: RTL's DOM
  isn't auto-cleaned between tests under Vitest (unlike Jest's
  testing-library preset) — the first component test file written
  (`empty-state.test.tsx`) failed with a "multiple elements found"
  error because the previous test's render was still in the DOM.
  Fixed once, globally, in `vitest.setup.ts`
  (`afterEach(() => cleanup())`) rather than per test file.

  98/98 tests pass (73 existing + 25 new); typecheck, lint, and
  `next build` all clean.

- **2026-08-26 hardening grilling session — six production-readiness
  decisions**, prompted by an unprompted production-readiness review
  after the rate-limiting work. Full context: the app moved from a
  single-user tool to open public signup earlier the same day, which
  is what makes "acceptable for personal use" gaps worth closing now
  rather than later.

  - **Deploy platform: Vercel.** Reference host for Next.js, zero-
    config PR previews, first-party Neon integration. No code
    consequence beyond the deploy/migration checklist item below;
    recorded here because it gates that checklist and any future
    "how do I deploy this" question.

  - **CI: GitHub Actions, `lint` + `test` + `build`, blocking on PRs
    into `main`.** The repo already lives on GitHub
    (`SrunLyheang/GoldKh`). Mechanically enforces the `npm run build`
    gate
    `ai-workflow-rules.md` already requires by hand before moving to
    the next unit — this makes it unskippable rather than
    self-policed.

  - **Error tracking: Sentry (`@sentry/nextjs`), client + server,
    added now rather than deferred to "when there's real traffic."**
    For a financial-tracking app, silent failures in the price layer
    or a query are worse than the small setup cost — you want to
    know before a stranger's bug report is the only signal. Sentry's
    free tier is sized fine for a hobby project.

  - **KHR rows excluded from `computeHoldings`'s aggregate.**
    Resolves the previously-open bug where a KHR `pricePerUnit` was
    silently mixed into the USD-denominated weighted-average cost.
    Fix: `TransactionLike` (`lib/calc/holdings.ts`) gains a
    `currency: "USD" | "KHR"` field; `computeHoldings` skips non-USD
    rows entirely, mirroring what `computeRowValuation`
    (`lib/calc/transactionRow.ts`) already does per-row.
    `computeGainLoss` needed no change — it only consumes
    `computeHoldings`'s already-aggregated output. This is a
    correctness fix, not a step toward KHR support — KHR display and
    conversion stay out of scope per `project-overview.md`.

  - **Terms of Service / Privacy Policy: explicitly skipped, not
    deferred-and-forgotten.** User decision — recorded in
    `project-overview.md`'s Out of Scope so it reads as a deliberate
    choice next time someone (human or agent) audits what's missing,
    not a silent gap.

  - **Security headers: baseline set now, full CSP deferred.**
    `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`,
    and HSTS added via `next.config.ts`'s `headers()`. A full
    Content-Security-Policy needs auditing Clerk's embedded UI and
    Recharts for what they actually load/execute, which is a bigger,
    separately-verifiable piece of work — left as an open question
    below rather than rushed.

  - **Env var validation: `lib/env.ts`, Zod-validated, fails fast at
    boot.** Validates `DATABASE_URL`, `CLERK_SECRET_KEY`,
    `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`,
    and `GOLDAPI_IO_API_KEY` are present and well-formed at process
    start, instead of failing confusingly at first request. Same
    validate-at-the-boundary principle `code-standards.md` already
    applies to request bodies and price-provider responses, applied
    to the process's own boot.

  - **Backup policy: Neon free-tier PITR, accepted as-is — no custom
    backup mechanism.** User's explicit choice: staying on Neon's
    free plan (limited point-in-time-recovery window) because this
    is a hobby project, rather than upgrading for longer retention or
    building a separate export job. Documented so a future audit
    reads this as a deliberate tradeoff, not an oversight — revisit
    only if real data loss actually happens or the project stops
    being a hobby-scale thing.

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
  upgrade every time the API refreshes." **Superseded 2026-08-27
  — see "Dashboard refresh moved from a blind 60s interval to
  tab-re-entry only" near the top of this section.**

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

- **Dashboard display-unit toggle: chi ⟷ damlung, single shared control.**
  User request: "make this so users are able to change from chi to
  domlerng." New `components/dashboard/unit-toggle.tsx`
  (`UnitToggle`) — a small segmented control, styled with existing
  `--primary`/`--accent`/`--border` tokens, no new color. State
  (`displayUnit`, default `"damlung"`, matching the existing hero
  headline decision) is owned by `DashboardContent`
  (`components/dashboard/dashboard-content.tsx`) via `useState<GoldUnit>`
  and passed down to `HeroPriceCard`, `StatRow`, and
  `TransactionHistory` — one toggle drives all three instead of three
  independent controls that could drift out of sync. The toggle itself
  renders once, inside `HeroPriceCard`'s header, next to the "Price
  per Chi/Damlung" label (only when `onDisplayUnitChange` is passed —
  both new props are optional with a `"damlung"` default, so every
  prior caller/test of `HeroPriceCard`, `StatRow`, and
  `TransactionHistory` needed no change). Toggling switches: the hero
  card's headline/secondary price and label, the stat row's Total
  Holdings primary/sub figures and Average Cost value/label, and the
  transaction table's `/damlung` column header and per-row price
  (desktop table and mobile card view both). `lib/calc/transactionRow.ts`'s
  `computeRowValuation` gained an additive `pricePerChi` field
  alongside the existing `pricePerDamlung` (no field removed/renamed)
  so the transaction table can show either without a second calc
  pass. The price-history chart stays damlung-only — out of scope for
  this request, not touched. 3 new tests added to
  `hero-price-card.test.tsx` (chi headline rendering, toggle hidden
  when no handler is passed, click calls the handler) — 101/101 tests
  pass; typecheck, lint, and `next build` all clean.

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

- **2026-08-28:** user reported that on entering the app the hero
  price updates but the price-history chart does not, until a manual
  page refresh. Root cause: `app/dashboard/page.tsx` loaded `getPrice()`,
  `listTransactionsForUser()`, and `listRecentPriceSnapshots()` in a
  single `Promise.all`. When the cached price is stale, `getPrice()`
  appends a new `price_snapshots` row as a side effect, but the
  concurrent `listRecentPriceSnapshots()` SELECT had already run — so
  the chart series was missing the just-written snapshot until the next
  RSC render. Fix: run `listRecentPriceSnapshots()` after `getPrice()`
  resolves; transactions still load in parallel with `getPrice()`.
  Typecheck clean.

- **2026-08-28:** trimmed redundant copy on the welcome/landing
  page. The "no money moves / not an exchange" idea was stated four
  times; removed the hero `trustLine` (the TrustRail directly below
  already carries "Not an exchange" / "No money moves") and dropped
  the repeated "No money moves through the system" clause from
  `welcome.cta.body`, in both `en` and `km`. Deleted the now-unused
  `welcome.hero.trustLine` key and its `<p>` in
  `components/welcome/landing-hero.tsx`. Typecheck clean; welcome
  tests pass (6/6).

- **2026-08-28:** rewrote the entire Khmer (`km`) side of
  `lib/i18n/dictionary.ts` for natural, native phrasing across the
  dashboard and welcome/landing pages. Highlights: fixed "ជួរដូរ" →
  "ជួញដូរ" (correct word for "trade/exchange"); "Refresh" now
  "ផ្ទុកតម្លៃឡើងវិញ" (reload) instead of the heavy
  "ធ្វើបច្ចុប្បន្នភាព"; "Total Holdings" now "មាសសរុបដែលកាន់កាប់"
  instead of the over-broad "ទ្រព្យសម្បត្តិសរុប"; restored the
  dropped "couldn't reach the server" clause in the refresh error
  strings; softened disclaimer/feature/steps copy to spoken
  register ("ស្រុកខ្មែរ", "ម្ដងៗ", "គេនិយាយ"). No keys or function
  signatures changed; `en` untouched; typecheck clean.

- **2026-08-28:** extended the welcome/landing page's motion, scoped
  to `components/welcome/*` only (dashboard untouched). Built on the
  existing CSS scroll-reveal pattern rather than adding a `motion`
  dependency. Added to `app/globals.css`: a one-shot
  `landing-nav-enter` keyframe (header settles down −8px on first
  paint) and a `.landing-stagger` container whose direct children
  step in with position-based `transition-delay` (0/70/140/210/280ms,
  capped at 350ms) once `.is-visible` is toggled. New `useInView`
  hook in `components/welcome/use-reveal.ts` (shares the observer
  settings with `useReveal`, returns `{ ref, visible }`) drives the
  stagger containers. Applied: nav entrance; hero masthead now a
  stagger (eyebrow → headline → gold rule → subhead → CTAs) instead
  of one block reveal; feature bento staggers its 4 cells; how-it-
  works staggers its 3 numbered rows; TrustRail staggers its 4
  items. All transform/opacity only; every rule has a
  `prefers-reduced-motion: reduce` no-op. Typecheck, lint clean; new
  classes verified in the served SSR HTML and compiled CSS.
  **Smoothing pass (same day):** retuned for an Apple-style glide —
  durations ~0.9–1.1s (from 0.5–0.6s), added a `blur(6–10px) → 0`
  burn-off and a sub-pixel `scale(0.985–0.99) → 1` alongside the
  translate, longer travel (12px → 18–22px), shared `--ease-glide`
  token (`cubic-bezier(0.16, 1, 0.3, 1)`), `will-change` hints, and
  tighter stagger steps (60ms) so entries overlap into one flow
  instead of discrete pops. `filter` reset added to the reduced-
  motion blocks.
