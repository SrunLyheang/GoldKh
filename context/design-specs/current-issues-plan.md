# Current issues — fix plan

Source: `context/design-specs/current-issues.md` (user's raw notes) +
grilling session 2026-08-30 (`mattpocock-skills:grilling`) +
panel design pass (`frontend-design:frontend-design`).

Branch: `fix/current-issues` off `main`. One phase at a time, each its
own `progress-tracker.md` entry, `npm run build` + full test suite green
between phases. Phases 2+ start only on the user's explicit go-ahead.

---

## Decisions (settled in grilling)

- **Q1 — Cost basis stays weighted-average.** The FIFO engine on the
  `realized-gain-loss-fifo` branch is *not* adopted. It contradicts
  `project-overview.md` ("weighted average only") and
  `context/product-strategy.md` ("FIFO … deliberately not building"),
  and issue #1 does not need it — realized P&L on a weighted-average
  basis gives exactly the "original price minus what they sold for"
  number the user asked for. Salvage the *panel idea*, drop the engine.
- **Q2 — Neither branch merges as a unit.** Cherry-pick specific files
  from `testing` via `git show testing:<path>`. Take nothing code-wise
  from `realized-gain-loss-fifo`. Both worktrees/branches deleted after
  the salvage.
- **Q3 — Khmer stays removed** (as the `testing` branch's PR 0 did, and
  as `product-strategy.md` already assumes). Re-add once translations
  are reviewed.
- **Q4 — Issue #2:** the dialog's price field becomes a single "Total
  amount paid" field. `pricePerUnit = total ÷ quantity` is derived on
  submit. DB column and Zod schema are unchanged (`pricePerUnit`), so
  the chart, break-even line, per-row valuation and edit flow keep
  working untouched. Edit mode pre-fills the field with
  `pricePerUnit × quantity`.
- **Q5 — Issue #3 sanity band**, checked on the *derived per-unit*
  price against current spot for the selected unit:
  - **Hard reject** outside `0.1× – 10×` spot — gates submit, inline
    message. Wide enough that a future price rise, a large purchase
    (per-unit is quantity-independent), or a genuinely bad deal all
    still save; only an extra zero or a wrong unit is caught.
  - **Soft notice** outside `0.5× – 2×` spot — informational, never
    gates submit.
  - Client-side only (the dialog). Server keeps `> 0` + 4-dp. Spot is
    not available server-side without a DB read and this is a
    fat-finger guard, not a security boundary.
- **Q6 — Realized panel placement & form:** full-width strip directly
  below the stat row, above the transaction history, in the existing
  32px rhythm. Rendered **only when the user has ≥1 sell** — before the
  first sale the dashboard is byte-identical to today. Same shape and
  internal grammar as the hero price card (full width, `lg` elevation,
  left readout / right context, same mobile stack), so the dashboard
  opens and closes its important numbers with two structurally
  identical readouts: spot price at top, realized result at bottom,
  stat chips as detail between.
  - Eyebrow `[ REALIZED ]`. Left: `.tt-label` `REALIZED · FROM {n}
    {SALE|SALES}`, large mono value tone-coloured
    (`--destructive` loss / `--state-gain` gain / neutral `--foreground`
    at exactly 0 → "broke even"), mono muted `%` sub-line. Right:
    `--muted-foreground` caption, ~34ch, right-aligned under the hero
    card's timestamp column: "Money you've locked in by selling gold,
    measured against what you paid for it. Gold you still hold isn't
    counted here — that's your unrealized figure above."
  - Only value + percent take a tone; border/labels/caption stay
    neutral. Reserve a sign cell so `−$285.00` and `$285.00` align on
    the digits (resolves the documented "Negative gain/loss alignment"
    open state).
  - All through the token contract (`Panel`, `.tt-label`, `MonoValue`
    `tone` prop, state tokens) — renders in all six themes with no
    per-theme rule.
  - **No blended "total return" number** — two clear rows (unrealized
    card up top, realized strip here) beat one merged figure for a
    saver.
- **Q7 — Issue #4 chart:** clamp the Y-domain to the spot series' own
  min/max plus padding; if the average-cost break-even `ReferenceLine`
  falls outside that domain, pin it to the edge with a small off-scale
  caret rather than rescaling the whole chart. Pre-existing rows that
  violate the Q5 band are flagged in the transaction history, never
  auto-deleted.
- **Q8 — Git mechanics:** salvage via `git show <branch>:<path>`, so
  nothing merges as a unit. After phase 5, user deletes local branches
  (`testing`, `realized-gain-loss-fifo`, `fixing-issues`, `fixing`, …)
  with `git branch -D` and runs
  `git worktree remove .worktrees/realized-gain-loss-fifo`.
  `origin/testing` stays until the user is certain. Nothing
  force-pushed; full history stays in reflog + remote.
- **Q9 — Order:** #2 first (its derived per-unit price is what #3 and #4
  depend on), then #3, #1, #4, then toasts, then animation. Toasts and
  animation are polish, salvaged last.

## Scope-doc change (approved)

`project-overview.md` "Out of Scope" line "Realized gain/loss and tax
reporting" → "Tax reporting (no Cambodian gold capital-gains regime).
FIFO / per-lot cost basis — weighted average only." Realized G/L moves
*in scope*; FIFO and tax stay out. Done as part of phase 3.

---

## Phases

### Phase 1 — Issue #2: "Total amount paid" input
- `components/dashboard/transaction-dialog.tsx`: relabel the price field
  to "Total amount paid"; on submit compute
  `pricePerUnit = Decimal(total).div(quantity)` (guard divide-by-zero /
  mid-typing); edit mode seeds the field with
  `Decimal(pricePerUnit).times(quantity)`. The summary box's "Total
  cost" line becomes the input's echo; keep "Current spot".
- `lib/i18n/dictionary.ts`: new/renamed strings (English only).
- `components/dashboard/transaction-dialog.test.tsx`: assert the derived
  `pricePerUnit` in the POST/PATCH body for a total + quantity pair.
- Verify: `tsc --noEmit`, `eslint`, `vitest run`, `next build` clean;
  manual add + edit round-trip.

### Phase 2 — Issue #3: price sanity band
- `lib/validation/priceSanity.ts` (+ test): pure
  `classifyPrice(perUnitUsd, spotPerUnitUsd)` →
  `"ok" | "soft-low" | "soft-high" | "hard-low" | "hard-high"` on the
  `0.1× / 0.5× / 2× / 10×` thresholds.
- `transaction-dialog.tsx`: run it on the derived per-unit price
  (KHR rows skip the check, matching the rest of the app). Hard verdict
  → inline message + gate submit; soft verdict → non-gating notice
  below the field.
- `dictionary.ts`: messages.
- Verify as phase 1.

### Phase 3 — Issue #1: realized gain/loss panel
- `lib/calc/realized.ts` (+ test): `computeRealized(entries: LedgerEntry[])`
  → `{ realizedUsd, realizedPercent, saleCount }`, weighted-average
  basis, one pass, KHR rows skipped (same rule as `computeHoldings`).
- `components/dashboard/realized-panel.tsx` (+ test): the strip per Q6.
- `components/dashboard/dashboard-content.tsx`: render it between the
  stat row and the transaction history when `saleCount > 0`.
- `context/project-overview.md`: scope line (above).
- `context/ui-context.md`: add the strip to Layout Patterns; mark
  "Negative gain/loss alignment" resolved.
- Verify as phase 1; panel hidden with zero sells, shows −285 on the
  buy-1-@5585 / sell-1-@5300 example.

### Phase 4 — Issue #4: chart robustness
- `components/dashboard/price-history-chart.tsx` (+ test): Y-domain
  clamp + off-scale break-even caret.
- `components/dashboard/transaction-history.tsx`: flag rows whose
  per-unit price is outside the Q5 hard band.
- `dictionary.ts`: the flag's tooltip/label.
- Verify as phase 1; chart stays stable with a bad legacy row present.

### Phase 5 — Cherry-pick error handling from `testing` — DONE 2026-08-30 (uncommitted)
- Khmer removal (Q3) was run now, not deferred — user confirmed this
  session. See `progress-tracker.md` "Phase 5" for the full writeup.
- From `git show testing:<path>`: `components/ui/sonner.tsx`,
  `lib/ui/toast.ts`, `lib/observability/scrubSentryEvent.ts` (+ test),
  the richer `lib/validation/transaction.ts` messages, the
  `next.config.ts` CSP tightening, `vitest.setup.ts` additions.
  Reconcile with phase 2's `priceSanity.ts`.
- Confirm Khmer stays out (Q3).
- Verify as phase 1.

### Phase 6 — Cherry-pick animation from `testing`
- From `git show testing:<path>`: `lib/ui/use-count-up.ts` (+ test),
  `components/dashboard/animated-pnl-card.tsx` (+ test), the `motion`
  dependency.
- Apply the roll-up to the P&L stat card and the phase-3 realized
  value. `prefers-reduced-motion` snaps to final.
- Verify as phase 1.

---

## After phase 6
- `git worktree remove .worktrees/realized-gain-loss-fifo`.
- User deletes dead local branches.
- Open a PR from `fix/current-issues` into `main`.
