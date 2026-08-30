# Dashboard polish — user-first pass

Source: session 2026-08-30. Follows `superpowers:brainstorming` on the
question "make the UI better, first-time user first" + the follow-up
where the user flagged the add-transaction screen flash specifically.

Branch: `fix/current-issues` (continues from the phases in
`current-issues-plan.md`, which are all landed).

**Design constraint that shaped every decision below:** the dashboard is
already a mature, deliberately-iterated design — the "Vault" industrial-
brutalist direction, a 6-theme CSS token contract, a spacing-rhythm
pass, a count-up animation system. `context/ui-context.md` says *"Vault
itself is the decided design, not a proposal."* So this is **polish
inside the existing token contract** — no palette changes, no new
themes, no layout restructure. Every change routes through existing
tokens / primitives (`Panel`, `MonoValue`, `.tt-label`, `.tt-bracket`,
`--primary`, the state tokens) so all six themes keep working with zero
per-theme rules.

Implementation plan: `docs/superpowers/plans/2026-08-30-dashboard-polish.md`.

---

## Goal

A first-time user goes: empty dashboard → add first buy → sees their
position. Today that path has three rough edges — a full-screen loading
flash on the reward moment, a thin empty state that doesn't explain the
product, and a duplicated success confirmation. Plus two standing polish
debts (`ui-context.md` "States Not Yet Designed"): negative-number
alignment and a stat row with no section label.

## Parts

### Part A — Kill the add-transaction flash

**Symptom.** Add / edit / delete a transaction and the whole dashboard
is replaced for ~1s by the route-level spinner in
`app/dashboard/loading.tsx` ("Loading your dashboard…").

**Cause.** After a successful mutation the code calls a bare
`router.refresh()` — in the dialog (`transaction-dialog.tsx`, end of
`handleSubmit`) and in `DashboardContent.handleDelete`. `router.refresh()`
re-runs the server tree, and while that RSC response is in flight Next
shows the nearest `loading.tsx` Suspense boundary. The optimistic update
has *already* painted the new row and recomputed the stats, so the
refresh is pure reconciliation — but it still trips the boundary, right
when a first-time user should be watching their first holding land.

**Fix.**

1. `DashboardContent` owns **all** refreshes, each wrapped in a
   `useTransition`:
   - `const [isSyncing, startSync] = useTransition();`
   - `handleAddSettled` → on `result.ok`, `startSync(() => router.refresh())`
   - `handleEditSuccess` → `startSync(() => router.refresh())`
   - `handleDelete` → the existing `router.refresh()` becomes
     `startSync(() => router.refresh())`
   React keeps the current UI painted during a transition, so
   `loading.tsx` never mounts.
2. `TransactionDialog` stops calling `router.refresh()` entirely — drop
   the `useRouter` import and the call. It already signals completion
   via `onAddSettled(tempId, { ok: true })` (add) and `onEditSuccess()`
   (edit); `DashboardContent` turns those into the transition refresh.
3. Replace the missing feedback with a **quiet inline cue**: a 2px
   `--primary` indeterminate bar directly under the Transaction History
   header while `isSyncing`. Under `prefers-reduced-motion` it is a
   static 40%-opacity full-width bar instead of a moving one.
4. `app/dashboard/loading.tsx` is unchanged — it still covers a genuine
   first navigation into `/dashboard`.

### Part B — Polish within Vault

1. **Signed-number alignment.** Closes the "Negative gain/loss
   alignment" open state in `ui-context.md`. Add a `signed` mode to
   `MonoValue`: when the (string) child starts with `+`/`-`/neither, the
   sign renders in its own fixed-width cell (`inline-block`, ~`0.6em`)
   so `-$285.00` and `$285.00` line up on the digits. Apply to every
   tone-coloured figure: the Unrealized Gain/Loss stat card
   (`AnimatedPnlCard`), the Realized panel value, and the P&L
   column/field in `TransactionHistory` (desktop table cell + mobile
   card). Non-string children render unchanged.
2. **Stat-row section label.** Hero, Realized, Transaction History and
   Price History all carry section headers; the four stat cards float
   unlabelled between them. Add an `<h2>` styled as `.tt-heading .tt-bracket
   text-[15px] text-foreground` — reading "Position" — above the grid inside
   `StatRow`, matching the Transaction History and Price History header
   treatment. New dict key `stat.sectionLabel: "Position"`. Gives the page
   a consistent five-beat structure.
   Price History all carry an eyebrow or a `[ … ]` title; the four stat
   cards float unlabelled between them. Add one `.tt-label .tt-bracket`
   eyebrow — `[ POSITION ]` — above the grid inside `StatRow`. New dict
   key `stat.sectionLabel: "Position"`. Gives the page a consistent
   five-beat structure.
3. **P&L card tone edge.** `AnimatedPnlCard` already tints its fill
   `gain`/`loss` at 6%. Add a 2px left border in the same tone token
   (`border-l-2 border-l-state-gain` / `border-l-destructive`) so the
   one number that carries meaning is visually anchored.
4. **Hero disclaimer as a footnote.** The dealer-premium disclaimer is
   currently a bare muted line hanging off the bottom of the hero card.
   Give it a hairline top border + a little more top padding
   (`border-t border-border pt-4`) so it reads as a footnote, not an
   afterthought. Copy unchanged.

### Part C — First-time user: the empty state

`components/dashboard/empty-state.tsx` today: an icon chip, a title, one
sentence, and a small button. It doesn't say what the product does.

- Add a three-step "how this works" list above the CTA, reusing the
  tone of the landing page's "Tracked in three steps" section:
  1. Add a buy — enter what you paid and how much gold.
  2. We value it against the live spot price, updated through the day.
  3. See your holdings, average cost, and unrealized gain or loss.
  New dict block `empty.steps` (array of three strings).
- CTA grows from `size="sm"` to the default button size — this is the
  primary action on an otherwise empty screen.
- Still one dashed-border `Panel`, all Vault tokens.

The first-add *reveal* itself needs no new code: `rows` going 0→1 swaps
`EmptyState` out for the stats/history/chart block, which already mounts
with the `.vault-enter` cascade. A separate one-shot highlight ring was
considered and cut (YAGNI — it needs client-side 0→1 transition
tracking for a marginal gain over the cascade that already plays).

### Part D — One success channel, not two

An add currently fires **both** a Sonner toast (`notify.success` in the
dialog) **and** an `InlineBanner` success strip in `DashboardContent`
(`successMessage` state → `TransactionHistory`). Two confirmations for
one action.

- Keep the toast — it is the global, consistent channel (edit and
  delete already rely on it).
- Remove the `successMessage` state, its auto-clear effect, and the
  success `InlineBanner`. `InlineBanner` stays for **errors** only —
  those belong anchored to the table where the failed row was, not in a
  transient toast.

## Files touched

| File | Part |
| --- | --- |
| `components/dashboard/dashboard-content.tsx` | A, D |
| `components/dashboard/transaction-dialog.tsx` | A |
| `components/dashboard/transaction-history.tsx` | A, B1, D |
| `components/dashboard/mono-value.tsx` | B1 |
| `components/dashboard/animated-pnl-card.tsx` | B1, B3 |
| `components/dashboard/realized-panel.tsx` | B1 |
| `components/dashboard/stat-row.tsx` | B2 |
| `components/dashboard/hero-price-card.tsx` | B4 |
| `components/dashboard/empty-state.tsx` | C |
| `lib/i18n/dictionary.ts` | B2, C |
| `app/globals.css` | A (indeterminate-bar keyframe) |
| `components/dashboard/*.test.tsx` (mono-value new; dialog, history, animated-pnl-card, realized-panel, empty-state updated) | all |
| `context/ui-context.md`, `context/progress-tracker.md` | housekeeping |

## Testing

- `mono-value.test.tsx` (new): `signed` renders equal-width sign cells
  for `"-$285.00"` and `"$285.00"`; non-string child passes through.
- `transaction-dialog.test.tsx`: the "adds a transaction" test asserts
  `onOpenChange(false)` + `notify.success` instead of `refreshMock`
  (the dialog no longer refreshes). Remove the `next/navigation` mock.
- `transaction-history.test.tsx`: drop the `successMessage` prop from
  every render; the "error and success banners" test becomes error-only.
- `animated-pnl-card.test.tsx`: a negative value gets the
  `border-l-destructive` class and a `signed` sign cell.
- `realized-panel.test.tsx`: value line renders in `signed` mode.
- `empty-state.test.tsx`: the three step strings render.
- Full suite + `next build` green.
- Manual: add a buy from the empty state → **no full-screen spinner**,
  the sync bar appears briefly under the history header, one toast only,
  the new row + stats animate in.

## Out of scope

Palette / theme changes. Layout restructure. Long-transaction-list
pagination (`ui-context.md` "States Not Yet Designed" — separate). The
un-localized literal `"Price History"` chart title (pre-existing).

## Doc updates on completion

- `context/ui-context.md`: marked "Negative gain/loss alignment" resolved
  (deleted bullet); noted the `<h2>` "Position" stat header, the sync bar,
  and that success feedback is toast-only. Updated "Mutation feedback"
  section, empty state with three-step flow, and `MonoValue` `signed` prop.
- `context/progress-tracker.md`: "Dashboard polish — user-first pass" entry
  added with status and deferred findings.
- `context/ui-context.md`: mark "Negative gain/loss alignment" resolved;
  note the `[ POSITION ]` stat eyebrow, the sync bar, and that success
  feedback is toast-only.
- `context/progress-tracker.md`: a "Dashboard polish" entry.
