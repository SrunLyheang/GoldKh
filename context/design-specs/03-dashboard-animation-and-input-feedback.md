# Dashboard animation & input feedback — grilling spec

Source: grilling session 2026-08-29 (`/mattpocock-skills:grilling`).
Status: **all four PRs (0–3) implemented 2026-08-29** — uncommitted in
the working tree at time of writing; no GitHub PRs were opened, so the
links below point at the corresponding `context/progress-tracker.md`
entries:

- PR 0 — remove Khmer + language toggle → progress-tracker
  "2026-08-29 — PR 0: removed Khmer locale + language toggle"
- PR 3 — validation + toasts → progress-tracker
  "2026-08-29 — PR 3: transaction input validation + toast feedback"
- PR 2 — dialog projected-holdings count-up → progress-tracker
  "2026-08-29 — PR 2: dialog projected-holdings count-up"
- PR 1 — dashboard animation → progress-tracker
  "2026-08-29 — PR 1: animated P&L stat card" (scoped to the P&L card;
  hero price tick / new-row highlight / refresh-icon spin deferred)

Delivery was four PRs in the order below. This file is the record of
what was decided and why.

## Scope

Three user asks, plus one that surfaced mid-session:

1. **Dashboard animation** — on refresh, the P&L figure animates; profit
   moves up, loss moves down; kept short. Plus a small set of other
   motion touches.
2. **Dialog live value** — as the user types a quantity in the Add
   Transaction dialog, a projected holdings value counts up/down.
3. **Input feedback overhaul** — comprehensive per-outcome messaging.
   Every outcome gets either an inline message or a toast; success and
   failure both surface.
4. **Remove Khmer + language toggle** (surfaced during Q21) — one
   language ships for now; Khmer returns after the user reviews the
   translations.

## Delivery order

`PR 0` (remove Khmer) → `PR 3` (validation + toasts) → `PR 2` (dialog
count-up) → `PR 1` (dashboard animation). Rationale: PR 0 is mechanical
and stops later PRs adding `km` strings; validation/toasts is the
highest user value and defines the success/failure feedback the later
PRs lean on; animation polish is last. Each PR is its own
progress-tracker entry, verified independently per
`ai-workflow-rules.md`.

---

## PR 0 — Remove Khmer + language toggle

- `lib/i18n/dictionary.ts` — delete the `const km: typeof en` object;
  narrow `Locale` to `"en"`; `dictionary` keeps only `en`.
- Delete `components/dashboard/language-toggle.tsx`.
- Remove `<LanguageToggle />` from `components/dashboard/sidebar.tsx`,
  `components/dashboard/dashboard-shell.tsx`,
  `components/welcome/landing-nav.tsx` (marketing page too — no switch
  anywhere while one language ships).
- **Keep** `LocaleProvider` / `useLocale` / `t.*` untouched. `locale` is
  permanently `"en"`. `setLocale` stays in the context API with no
  caller — removing it means editing the provider and type for no gain.
  `goldkh-locale` localStorage key becomes inert; leave it.
- `components/dashboard/segmented-control.tsx` stays — `UnitToggle`
  still uses it.
- `app/globals.css` `html[lang="km"]` blocks (lines ~571, ~662-667) and
  the `--font-khmer` load become dead with `lang="en"` but are
  harmless. Leave them so the `landing-page` branch's editorial redesign
  isn't disturbed. Note as a later cleanup.
- New strings in PRs 1-3 still route through `dictionary.ts`, English
  only. Re-adding Khmer later = restore the `km` object + a toggle.

Verify: `tsc --noEmit`, `eslint`, `vitest run`, `next build` all clean;
sidebar, mobile top bar, and landing nav render without the toggle.

---

## PR 3 — Validation + toasts

### Toast infrastructure

- Install `sonner` via the shadcn CLI. `<Toaster>` mounted in the
  dashboard layout.
- Themed to Vault tokens: `--card` fill, `--border`, gold accent.
  Bottom-right. `richColors` **off** — we supply green/red ourselves so
  they stay the financial-meaning tokens (`--state-gain` /
  `--destructive`), never decorative.
- Success toast: `--state-gain`, ~3s auto-dismiss.
- Error toast: `--destructive`, ~6s, dismissible.
- Deduped by `id` so repeated submits don't stack duplicates.
- All strings added to `dictionary.ts` (English only).

### Inline vs toast split

- **Per-field problems** stay **inline** (they point at the broken
  field) **and** gate submit.
- **Submit-level outcomes** fire **toasts**: success, server rejection,
  network failure, rate-limit, auth-expired.
- **No toast while typing.** Toasts fire only on: submit attempt with
  validation errors, and each async result.
- **Remove** the dialog's bottom inline `error` banner — the toast
  replaces it. Dialog stays open on failure with all input intact
  (unchanged behavior); the toast is the failure signal.

### Schema changes — `lib/validation/transaction.ts`

Current: `quantity` / `pricePerUnit` are
`z.string().regex(/^\d+(\.\d{1,4})?$/, "Invalid …")` — one generic
message, max 4 decimals, no min/max.

Add distinct messages and rules:

- `quantity > 0` — "Enter an amount greater than zero."
- `quantity >= 0.01 chi`-equivalent floor (≈ 0.001 damlung, ~0.0375 g) —
  "The smallest amount you can log is 0.01 chi." Floor is checked in
  chi-equivalent regardless of the selected unit.
- non-numeric / bad format (paste, comma) — "Enter a number, like 2.5."
- more than 4 decimal places — "Use at most 4 decimal places."
- `pricePerUnit > 0` — "Enter a price greater than zero."
- `transactionDate` not in the future — "The date can't be in the
  future."
- `notes` over 500 chars — "Notes can't be longer than 500 characters."
  (schema already caps at 500; add the message)

### Exceeds-holdings on a sell — now a hard block

Today `exceedsHoldings` is a soft, non-blocking warning. Change to:
inline message "You only hold X chi to sell." **and** submit is gated.
Selling more than held is never valid data.

### Outcome → feedback table

Rows 1-9 are toasts, rows 10-16 are inline + gate submit.

| #  | Trigger                                   | Kind             | Copy (en) |
|----|-------------------------------------------|------------------|-----------|
| 1  | Buy saved                                 | success toast    | "Added 2.5 chi to your holdings." (qty + unit interpolated) |
| 2  | Sell saved                                | success toast    | "Recorded sale of 2.5 chi." |
| 3  | Edit saved                                | success toast    | "Transaction updated." |
| 4  | Submit with invalid fields               | error toast      | "Check the highlighted fields." |
| 5  | `INVALID_INPUT` from server (400)        | error toast      | "Something in this transaction isn't valid. Check your entries and try again." |
| 6  | `RATE_LIMITED` (429)                     | error toast      | "You're saving too fast — wait a moment and try again." |
| 7  | `UNAUTHORIZED` (401)                     | error toast      | "Your session expired. Sign in again to save." |
| 8  | 500 / unknown                             | error toast      | "Couldn't save — something went wrong on our end. Try again." |
| 9  | Network / fetch threw                    | error toast      | "No connection. Check your internet and try again." |
| 10 | Quantity ≤ 0                              | inline + gate    | "Enter an amount greater than zero." |
| 11 | Quantity below 0.01 chi floor            | inline + gate    | "The smallest amount you can log is 0.01 chi." |
| 12 | Non-numeric / bad format                 | inline + gate    | "Enter a number, like 2.5." |
| 13 | More than 4 decimal places               | inline + gate    | "Use at most 4 decimal places." |
| 14 | Price ≤ 0                                 | inline + gate    | "Enter a price greater than zero." |
| 15 | Date in the future                       | inline + gate    | "The date can't be in the future." |
| 16 | Notes over 500 chars                     | inline + gate    | "Notes can't be longer than 500 characters." |

### Client wiring — `transaction-dialog.tsx`

- Switch on `body.error?.code` (`INVALID_INPUT` / `RATE_LIMITED` /
  `UNAUTHORIZED`), fall through to the 500 copy, and treat a thrown
  `fetch` as the network case.
- Buy vs sell success copy keyed off `type`.
- Optimistic-add failure path still rolls the row back; the toast is now
  the only visible failure signal (no inline banner).

---

## PR 2 — Dialog projected-value count-up

- Install `motion` (`npm i motion`, `import … from "motion/react"`;
  supports React 19 / Next 16). framer-motion's successor.
- New line in the dialog's existing summary box: **"Projected holdings
  value"** = current market value + this purchase valued at current
  spot. Always shown in **USD**, even when the purchase currency is KHR
  (holdings are tracked at USD spot).
- Counts up as the quantity rises, **down** as it falls.
- `animate(from, to, { duration: 0.3, ease: "easeOut" })` driving a
  `useMotionValue`; the tween is re-aimed on each keystroke — no
  debounce; a short re-aimed tween reads as smooth tracking.
- `prefers-reduced-motion` → snap to final value, no tween.
- Ships the shared helper:
  `useCountUp(target, { durationMs, format })` — built on `motion`'s
  `animate` + `useMotionValue`, returns the formatted string, respects
  `useReducedMotion()`. Reused by PR 1.

---

## PR 1 — Dashboard animation

> **Status 2026-08-29:** shipped **scoped to the P&L stat card only**
> (`components/dashboard/animated-pnl-card.tsx`). Hero price tick,
> new-row highlight, and refresh-icon spin are **deferred** — do them on
> a clean base once the concurrent security-review / observability work
> in the tree is committed. Card uses `motion`'s `animate` directly, not
> `useCountUp` (async-determined start value). See progress-tracker.
>
> **Mechanic redefined (user, 2026-08-29):** most numbers **roll from
> zero to their real value on every page entry** (positive rolls up,
> negative rolls down). No delta-driven slide or pulse. Implemented via
> `useCountUp`'s new `from` option (entrance tween on mount; later
> `target` changes — a unit toggle, a price refresh — snap). Applied to
> the **hero price per damlung/chi** and **all four stat cards** —
> Total Holdings, Average Cost, Market Value roll from zero.
>
> **Exception — Unrealized Gain/Loss** (`AnimatedPnlCard`): rolls from
> the value the user last saw, persisted in `localStorage` under
> `goldkh-last-pnl` (plain key — not per-Clerk-user; a wrong baseline
> right after an account switch is a one-time cosmetic blip, revisit if
> it matters), so on a refresh it visibly moves up or down *from the
> previous position* rather than from zero. First visit / unchanged
> value / reduced-motion render static. The price-history chart is still
> not animated.
>
> **Timing (after "numbers go up too fast", motion-ui skill consulted):**
> the problem was an ease-**out** curve — it dumps ~80% of the travel
> into the first ~400ms, so the digits blur past then crawl. Replaced
> with a gentle sine ease-in-**out** (no fast section anywhere):
> `SMOOTH_EASE = [0.37, 0, 0.63, 1]`. Duration lifted to
> `COUNT_UP_MS = 2200` — long enough that the per-frame step stays small
> and the number looks counted, not scrubbed. Both exported from
> `lib/ui/use-count-up`; dialog projected-value stays short (**550ms**,
> it tracks typing). The `1.4s / 450 / 400 / 500 / 300ms` figures and
> the slide/pulse spec below are superseded.
>
> **Also fixed:** the entrance wasn't playing on refresh at all in
> `next dev` — React StrictMode double-mounts effects and the old
> "animate once" latch (`hasRunRef` in `useCountUp`; a synchronous
> localStorage write in `AnimatedPnlCard`) made the second mount snap.
> `useCountUp` no longer latches; `AnimatedPnlCard` persists only after
> the roll completes. `vitest.config.ts` now excludes `.worktrees/**`.

### P&L stat card (the only stat card that animates)

- On mount, read `goldkh-last-pnl:<clerkUserId>` from localStorage
  (Clerk `useUser()` gives the id). Store the raw decimal string.
- If no stored value (first visit, cleared storage): **static render**,
  no animation, then store.
- If stored value **equals** new value: **no animation**.
- Otherwise: number tweens from stored → new, **450ms easeOut** (via
  `useCountUp`). Then store the new value.
- **Colour** = value sign — keep `toneFromAmount` (green = you're up).
  Unchanged.
- **Motion direction + pulse** = delta sign (did the position improve or
  worsen since last look). Profit-direction → card lifts ~6px from
  below; loss-direction → settles ~6px from above. Card slide 400ms
  easeOut. One-shot pulse: 500ms, value-colour at ~12% background.
- Crossing zero (was −$20, now +$10) → slides up, settles green.
- Percent sub-line **snaps**, does not count.

### Triggers

Hard browser refresh **and** the in-app Refresh button (same user
intent — "get me the latest"). **Not** client-side navigation back to
the dashboard.

### Other motion

- **Hero price tick** (on Refresh): same 450ms count-up old → new spot,
  plus a 1px up/down caret coloured by tick direction that fades over
  600ms.
- **New transaction row** (after Add): row slides in 250ms, holds a
  faint `bg-primary/8` that fades over 1s so the user sees where it
  landed.
- **Refresh icon**: one 360° spin, 600ms, while fetching.

### Not doing (decoration that ages fast)

- Stat-row stagger-in on first load.
- Chart line draw-on.
- Live-dot breathing pulse — optional, only if ambient life is wanted
  later.

### Accessibility

`prefers-reduced-motion: reduce` skips every tween, slide, pulse, spin,
and caret — final state renders instantly. Non-negotiable for financial
data.

---

## Open copy questions (not blocking)

- Exact wording of rows 5, 8, 9 can be tightened.
- The 0.01 chi floor could be raised to 0.1 chi if it proves too
  permissive — single constant.
