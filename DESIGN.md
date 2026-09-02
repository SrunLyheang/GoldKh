# Design System — GoldKh

> Canonical design reference for the signed-in app. Supersedes the
> `context/ui-context.md` that older `globals.css` comments point at
> (that file never existed — see [Sharpen #5](#5-the-phantom-ui-contextmd)).
> Read this before any visual or UI change. The landing page
> (`components/welcome/*`, `data-landing-theme`) is a separate scoped
> tree and is out of scope here except where noted.

---

## Product Context

- **What this is:** A personal portfolio tracker for physical gold. Users log
  buys and sells made in person at Cambodian gold shops; the dashboard derives
  holdings, weighted-average cost, market value, and gain/loss against a cached
  live spot price on every load.
- **Who it's for:** People who think in **chi** and **damlung** and treat gold as
  savings, not a trading instrument — local holders in Cambodia and the diaspora
  tracking gold held back home.
- **Space / peers:** Net-worth and bullion trackers — BullionVault, Empower,
  Kubera. GoldKh deliberately sits opposite them: record-keeping, not trading.
- **Project type:** Data-dense web app (dashboard-first), plus one marketing
  surface (the landing page) that redirects to the dashboard once signed in.

### The memorable thing

**"It always just works."** Never a blank, never an error screen — always a
price with an honest timestamp, always a trustworthy position figure. Every
design decision serves that. See [Degraded & Stale States](#degraded--stale-states),
which is the section that makes this real.

### Voice

Plain, precise, unhyped. Explain the mechanism ("weighted average, not FIFO").
State limits honestly ("your local price may not match"). Never sell urgency.
Financial green / red carry meaning only — gain or loss — never decoration.

---

## Aesthetic Direction

- **Direction:** Industrial / utilitarian at the core (mono micro-typography,
  bracket-framed section headers, tabular figures reading as telemetry), with a
  **theme layer** that lets the same components present as anything from frosted
  luxury to Swiss-flat.
- **Decoration level:** `liquid-glass` (the default) is **intentional** — a
  near-black ground with faint fixed grain, frosted glass cards, a single amber
  accent, a low-opacity sparkle field, and a cursor glow. The other five themes
  range from **minimal** (Porcelain: no shadow at all) to **intentional**
  (Emerald: soft green-tinted elevation).
- **Mood:** A calm savings ledger you check between shop visits, not a trading
  terminal. Research consensus for this category — "in financial UI, calm is
  credibility" — GoldKh answers it with restraint in the figures and color,
  and permits personality in the surface treatment.
- **Reference points:** Mercury (calm money surface), BullionVault app (holdings
  valuation + honest "as of"), Empower (net-worth-over-time chart clarity).

### Themes

Seven idioms. `liquid-glass` is the default and the only fully hand-tuned glass
theme; the rest recolor the same `.glass-*` / `.tt-*` classes from their own
palette. Adding a theme is one CSS block in `globals.css` and zero component
changes — that property must be preserved.

| Theme | Ground | Accent | Corner | Heading voice | Elevation |
|-------|--------|--------|--------|---------------|-----------|
| **Liquid Glass** (default) | near-black `#050505` | amber `#e8b84b` | 16px | sans, sentence, 600, tight | frosted glass + ambient shadow + ✦ eyebrow |
| **Midnight** | blue-black `#090d18` | indigo `#7c9cff` | 16px | sans, sentence, **light 300**, airy | borderless, large soft blue glow |
| **Emerald** | forest `#071410` | emerald `#34d17e` | 20px | sans, **UPPERCASE, heavy 800**, tight | chunky, green-tinted shadow |
| **Ledger** | warm paper `#f7f6f3` | ink `#201f1c` / brass `#9a7b4f` | 8px | **Newsreader serif**, 500, no brackets | soft 1px shadow |
| **Coral** | blush `#fff7f4` | coral `#e14b45` / teal `#0f9d8f` | 14px | sans, sentence, 600, tight | soft coral-tinted shadow |
| **Porcelain** | cool white `#fbfcfd` | blue `#1d4ed8` | 3px | sans, **UPPERCASE, wide-tracked** | **no shadow** — hairline border only |
| _base_ (`:root`) | `#0f0c08` | amber `#e8b84b` | 0px | — | pre-hydration fallback, not selectable |

Theme list and default live in `lib/theme/theme-context.tsx`. Every real theme
block is written `:root[data-theme="x"], [data-theme="x"]` so a nested
`<div data-theme="x">` (the picker swatches) gets the full token set.

---

## Typography

### Families

| Role | Font | Loaded as | Why |
|------|------|-----------|-----|
| **UI / body** | IBM Plex Sans (400/500/600/700) | `--font-plex-sans` (next/font) | Humanist grotesque with real character — flared terminals, true italic — vs. a generic system stack. |
| **Every figure** — price, quantity, cost basis, %  | IBM Plex Mono (400/500/600) | `--font-plex-mono` | Real tabular figures; pairs with Plex Sans as one family, so number columns read as typesetting, not "monospace = technical". |
| **Ledger theme** headings + hero price | Newsreader (400/500/600, + italic) | `--font-newsreader` | Editorial serif. Referenced only from the `[data-theme="ledger"]` block. |
| **Landing display** | Fraunces (400/500/600, + italic) | `--font-fraunces` | Marketing-page headings only (`components/welcome/*`). |

**Rule:** all numbers render on the mono face with `font-variant-numeric:
tabular-nums`, reached through `.tt-display` for the hero figure and
`MonoValue` / `CountUpValue` elsewhere. A theme may repoint `--display-font`
at a serif (Ledger does); `tabular-nums` stays on regardless so digits still
align.

### Idiom tokens (the theming seam)

Components never hardcode a heading font, transform, or tracking. They apply a
`.tt-*` class; the class reads a per-theme token. This is what makes a new
theme one CSS block.

| Class | Reads | Used for |
|-------|-------|----------|
| `.tt-label` | `--label-font`, `--label-transform`, `--label-tracking` | every label, nav item, table header, status line, metadata |
| `.tt-heading` | `--heading-font`, `--heading-transform`, `--heading-tracking`, `--heading-weight` | section titles (not body copy) |
| `.tt-display` | `--display-font` + always `tabular-nums` | the one hero price headline |
| `.tt-bracket` | `--bracket-open` / `--bracket-close` pseudo-content | section-title framing — `[ STAT ]`, or `✦ STAT` on Liquid Glass, or nothing on Ledger |
| `.tt-eyebrow` | `--eyebrow-glyph` | standalone ✦ before empty-state / sub-section titles |

### Scale — **Sharpen #1**

**Problem:** the dashboard has no scale. Components hardcode `text-[11px]` (×74),
`text-[13px]` (×24), `text-[15px]` (×16), `text-[12px]` / `text-[12.5px]`,
`text-[10px]`, `text-[19px]`, `text-[11.5px]`, `text-[34px]`, `text-[46px]`,
`text-[17px]` … as one-off arbitrary values. The landing tree separately uses
Tailwind's default `text-3xl` / `text-4xl`.

**The scale** (semantic names, not t-shirt sizes — matches the `.tt-label`
philosophy; scaffolded as tokens in `globals.css`, see below):

| Token / utility | rem | px | Role | Replaces the one-offs |
|-----------------|-----|-----|------|----------------------|
| `text-micro` | 0.625 | 10 | micro labels (use sparingly) | `text-[10px]` |
| `text-label` | 0.6875 | 11 | labels, metadata, status lines — the `.tt-label` workhorse | `text-[11px]`, `text-[11.5px]` |
| `text-detail` | 0.8125 | 13 | secondary body, table cells, sublines, disclaimers | `text-[12px]`, `text-[12.5px]`, `text-[13px]` |
| `text-body` | 0.9375 | 15 | body copy, section headings (`.tt-heading`) | `text-[14px]`, `text-[15px]` |
| `text-emphasis` | 1.0625 | 17 | emphasized body | `text-[17px]` |
| `text-figure` | 1.1875 | 19 | stat-card values | `text-[19px]` |
| `text-figure-lg` | 1.75 | 28 | sub-hero figures | `text-[28px]` |
| `text-display` | 2.125 | 34 | hero price, mobile | `text-[34px]` |
| `text-display-lg` | 2.875 | 46 | hero price, desktop | `text-[46px]`, `text-[40px]` |

**Line-height:** body `1.5`; `.tt-heading` `1.2`; `.tt-display` and the hero
price `1.05` (`leading-tight` / `leading-none`).
**Tracking:** per theme via `--heading-tracking` / `--label-tracking`; never set
ad hoc on a component.

**Migration:** the tokens exist now; components move off `text-[Npx]` onto these
utilities incrementally (a `/design-review` job). New code uses the utilities
from day one — no new `text-[Npx]` arbitrary values.

---

## Color

- **Approach:** restrained. One accent per theme; color otherwise means one of
  exactly two things — **gain** or **loss**.
- **Model:** shadcn semantic tokens (`--background`, `--foreground`, `--card`,
  `--primary`, `--muted`, `--muted-foreground`, `--border`, `--accent`,
  `--destructive`, `--ring`, `--popover`, `--secondary`, `--sidebar-*`) plus
  GoldKh additions:
  - `--state-gain` — the **only** positive-financial color. There is no
    `--state-loss`; loss reuses `--destructive`. Gain/loss is the one place
    color is allowed to carry meaning.
  - `--chart-1..5` — see [Charts](#charts--sharpen-4).
  - `--glass-*`, `--glow-*`, `--sparkle-opacity` — surface treatment, see
    [Surfaces](#surfaces).
- **Accent usage:** `--primary` is the brand mark, the hero top-rule, the focus
  ring, the count-up pulse tone, and `chart-1`. It is not a button-fill default
  beyond the primary CTA.
- **Dark vs light themes:** four dark (`liquid-glass`, `midnight`, `emerald`,
  base) and three light (`ledger`, `coral`, `porcelain`). Light themes get a
  dark-tinted frost + soft shadow (so glass still reads as glass on paper) and
  the sparkle field off. This is handled in `globals.css`, not per component.
- **Contrast:** body text and figures must clear WCAG AA (4.5:1). The muted
  foreground on each theme is tuned to still register against its ground —
  `--muted-foreground` is for de-emphasis, never for text a user must read
  precisely (a figure is never muted-only).

### Figure precision (`lib/format/money.ts`)

| Value | Rule |
|-------|------|
| USD amounts | `Intl.NumberFormat` currency, max 2 fraction digits |
| Quantities (chi / damlung) | max 4 fraction digits (matches DB `numeric(_,4)`); trailing zeros trimmed, never rounds away an entered digit |
| Percent | always signed (`+1.25%` / `-0.80%`), 2 fraction digits |

Formatting is presentation-only — it never does money math. All math is decimal
(`decimal.js`), derived on every load, never persisted.

---

## Spacing & Layout

- **Base unit:** 4px (Tailwind default scale). Dashboard spacing stays on-scale
  (`gap-4`, `gap-5`, `mb-4`, `mt-1.5`, `pt-4`) — keep it there; no arbitrary
  `[Npx]` margins/paddings.
- **Density:** comfortable. Short-visit product — the dashboard is a check-in,
  so vertical rhythm favors scanning (section label → figure → subline) over
  packing.
- **Grid:** stat row is `grid-cols-2` → `lg:grid-cols-4`. Dashboard content is a
  single column of stacked sections (hero → stats → realized → history → chart),
  each entering on a staggered fade-up.
- **Border radius:** hierarchical, all derived from one per-theme `--radius`:

  | Token | Value |
  |-------|-------|
  | `--radius-sm` | `--radius * 0.6` |
  | `--radius-md` | `--radius * 0.8` |
  | `--radius-lg` | `--radius` |
  | `--radius-xl` | `--radius * 1.4` |
  | `--radius-2xl` | `--radius * 1.8` |
  | `--radius-3xl` .. `--radius-4xl` | `* 2.2` .. `* 2.6` |

  `--radius` ranges from `0px` (base) to `20px` (Emerald). Glass surfaces use
  `--glass-radius` (defaults to `--radius`, Liquid Glass overrides to 20px).
  Never hardcode a corner value.

---

## Surfaces

Reached only through classes, never hardcoded. All read per-theme `--glass-*` /
`--glow-*` tokens, so a theme switch recolors them with no JSX change.

| Class | For | Treatment |
|-------|-----|-----------|
| `.glass-surface` | scrolling cards | **no** `backdrop-filter` (it shivers under scroll); near-opaque tinted fill + masked gradient-border ring + ambient shadow |
| `.glass-surface--accent` | hero / primary surface | above + fill tinted toward `--primary` (the gold-glass look) |
| `.glass-overlay` | non-scrolling overlays only — sidebar, dialogs, popovers, dropdowns, sticky bars | real `backdrop-filter: blur(--glass-blur)` over a translucent fill; `@supports` fallback to opaque `--glass-fallback-bg` |
| `.glass-chrome` | sidebar + sticky headers | real blur, **no** gradient ring (would round against the viewport edge); pair with one hairline `border-*` on the meeting edge |
| `.glass-glow` | cards that respond to the cursor | token-driven radial glow at `--spot-x/y`; lifts `translateY(-3px)` on hover under `hover: hover` + `prefers-reduced-motion: no-preference` |
| `.app-grain` | page root | fixed low-opacity (0.035) SVG fractal-noise layer, own compositor layer, **no** `mix-blend-mode` on dark (blended full-viewport fixed layer = scroll jank); `multiply` only on the three light themes |

Hairline dividers everywhere (row separators, in-card rules) use
`--glass-border-to`.

---

## Motion

- **Approach:** intentional. Entrances and state transitions only; nothing
  decorative on the dashboard. (The landing tree has its own longer, showier
  reveal choreography — out of scope here.)
- **Easing:**

  | Token | Curve | Use |
  |-------|-------|-----|
  | `--ease-glide` | `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutQuint-ish) | dashboard section entrances, nav entrance, value pulse, staggered reveals — **the default** |
  | _hover lift_ | `cubic-bezier(0.22, 1, 0.36, 1)` | `.glass-glow` hover transform/shadow only |
  | `SMOOTH_EASE` `[0.37,0,0.63,1]` | ease-in-out | the count-up number roll (`lib/ui/use-count-up.ts`) |

  Prefer `--ease-glide`. New motion that isn't a hover lift or a number roll
  uses it.
- **Duration:** micro 150–200ms · short ~280–300ms (row-in, hover) · medium
  500–600ms (section entrance 500ms, value pulse 600ms) · count-up roll 2200ms
  (`COUNT_UP_MS`, first load only). Nothing on the dashboard runs longer than
  the count-up.
- **Compositor-only:** animate `transform` and `opacity` only. No animated
  `width` / `height` / `top` / `left`, no animated `blur`, no `transition: all`.
- **`prefers-reduced-motion: reduce` is mandatory.** Every effect has a reduced
  path: section entrances render static, the value pulse is suppressed, the
  count-up snaps, the sync sliver becomes a static dimmed bar, `.glass-glow`
  doesn't lift. A new effect without a reduced path is incomplete.

### Number-animation policy — **Sharpen #2**

One rule, currently spread across `use-count-up`, `use-value-pulse`, and
`AnimatedPnlCard`:

| Situation | Behavior | Mechanism |
|-----------|----------|-----------|
| **First page entry** | Total Holdings, Average Cost, Market Value, and the hero price **roll up from zero** over `COUNT_UP_MS` (2200ms). Unrealized Gain/Loss rolls from its **last-seen** value instead. | `CountUpValue` with `from={0}` / `AnimatedPnlCard` |
| **Unit toggle** (chi ↔ damlung) | figures **snap** — no roll. It's a re-projection, not a new value. | `useCountUp` `from` mode |
| **Data update** (refresh, add, sell) | the figure **flashes its tone once** (`--pulse-tone`, 600ms) and **lands on the new value — it snaps, never re-rolls.** | `useValuePulse` → `.value-pulse-active` |
| **Post-mutation reconcile** | an indeterminate sliver runs under the Transaction History header while `router.refresh()` settles inside a `useTransition` — the page never blanks. | `sync-indeterminate` keyframe |

New figure displays follow this exactly. Never re-roll a figure on a data
change; the roll is a first-impression flourish, not a change indicator.

---

## Degraded & Stale States

**This is the section that delivers "it always just works."** Research rule for
the category: *showing staleness matters more than showing freshness — a cached
figure without disclosure is worse than showing nothing; a visible timestamp
plus a retry control turn a broken screen into an honest one.*

### The price is always present

The dashboard shows the last known snapshot with an "as of" timestamp rather
than an error, even when every upstream provider is down. Snapshots are
append-only, written on dashboard load — there is no scheduled job. A stale
price is a **normal** state (users check in between in-person shop visits), not
a failure. Design it as the confident default, **not** a warning.

### Freshness states (current, canonical — see `hero-price-card.tsx`)

| State | Threshold | Dot | Label | Tone |
|-------|-----------|-----|-------|------|
| **Live** | snapshot < 30 min old | `--state-gain` (green), `1.5×1.5` | `[ LIVE ] as of {clock time}` | confident, unremarkable |
| **Stale** | snapshot ≥ 30 min old | `--muted-foreground` (grey), same size | `[ STALE ] as of {clock time}` | **muted, not alarm.** Grey dot, `.tt-label`, mono. No red, no icon, no banner. |
| **Market closed** | provider reports closed | — | extra `.tt-label` line: `market closed` | muted |

Never use `--destructive` for staleness. Red means financial loss, not old
data. Any surface that shows the price (hero, chart header, insights readouts)
uses this same dot + `[ STATE ] as of {time}` treatment — do not invent a
second staleness style.

### Manual refresh

- `RefreshButton` reads `refreshCooldownEndsAt`. A refresh within 5 minutes of
  the last is on **cooldown** — the button shows the remaining time and is
  disabled; it is not hidden.
- Disabled affordance: reduced opacity + `cursor: not-allowed`. Same as every
  disabled control.
- Market-closed disables refresh with the reason shown, not a silent no-op.

### Empty & error

- **No transactions yet:** `EmptyState` — a warm one-line message + the primary
  "Add transaction" action + a ✦ eyebrow. Never a bare "No items."
- **A mutation fails:** rolled back optimistically and reported through the
  shared Sonner toast. There is no second in-page error banner.
- **Standing disclaimer:** every price surface carries the "local buy/sell
  prices won't match the global spot" line, hairline-separated, `text-detail`,
  muted. It's context, not an error.

### Snap, don't blank

Post-mutation refreshes run inside `useTransition` so the page never goes
blank. Sections use a keyframe with `both` fill that plays at first paint (SSR
markup included) — a section is never blank waiting on hydration; the price is
readable as soon as the HTML lands.

---

## Charts — **Sharpen #4**

Recharts 3. `--chart-1..5` are defined per theme but series assignment was never
written down. Canonical mapping:

| Slot | Token | Semantic |
|------|-------|----------|
| `chart-1` | `--primary` (accent) | the **primary series** — spot price over time, portfolio value over time |
| `chart-2` | `--muted-foreground` | secondary / reference series — cost-basis line, average line |
| `chart-3` | `--state-gain` | **gain** — positive area/segments on the P&L-over-time chart |
| `chart-4` | `--destructive` | **loss** — negative area/segments |
| `chart-5` | `--foreground` | high-contrast marker — the "now" point, a highlighted selection |

Rules:
- Gain/loss on any chart uses `chart-3` / `chart-4` — the same green/red meaning
  as everywhere else. A value-over-time chart that crosses break-even is green
  above, red below.
- Axes and gridlines: `--border` at low opacity; axis labels `.tt-label`
  `text-micro` / `text-label`, `--muted-foreground`. Gridlines horizontal only
  unless the x-axis carries meaning the reader must measure against.
- Tooltip: `.glass-overlay` surface, figures on the mono face, `tabular-nums`,
  same precision as `lib/format/money.ts`.
- The chart header carries the same freshness dot + `as of` treatment as the
  hero when it plots live price.
- Respect `prefers-reduced-motion`: no draw-on animation when reduced.

---

## The phantom `ui-context.md` — **Sharpen #5**

`globals.css` references `context/ui-context.md` ~15 times and `PRODUCT.md`
calls it "the signed-in design system." **The file was never created.**

- `DESIGN.md` (this file) is now the canonical reference.
- A 2-line stub at `context/ui-context.md` points here, so the existing code
  comments resolve to something real.
- New code comments cite `DESIGN.md`, not `context/ui-context.md`.

---

## Accessibility

No formal WCAG target is set as a product requirement. Existing practice to
preserve:

- One token-driven `:focus-visible` ring (`2px solid var(--ring)`, `2px`
  offset) fills the gap for bespoke dashboard controls; shadcn / Base UI
  primitives ship their own and win on specificity. Never `outline: none`
  without a replacement.
- Every motion effect has both a `prefers-reduced-motion` path **and** a
  touch / small-viewport path.
- Financial figures snap rather than re-roll on data change (see the
  number-animation policy).
- Body text and figures clear 4.5:1. A precise figure is never
  `--muted-foreground`-only.
- Touch targets ≥ 44px on interactive elements.

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-09-03 | DESIGN.md created (codify + 5 sharpen sections) | `/design-consultation`. Codified the existing 7-theme token system; added a written type scale, an explicit number-animation policy, a canonical stale-state spec, chart-color assignment, and resolved the phantom `context/ui-context.md`. |
| 2026-09-03 | Stale price = muted grey, never red | Users check in between in-person shop visits; a 30-min-old price is normal, not an error. Red is reserved for financial loss. Research: "showing staleness matters more than showing freshness." |
| 2026-09-03 | Type scale uses semantic names (`text-label`, `text-figure`…), added as new tokens | Additive — does not override Tailwind's default `text-*` steps, so the landing tree is unaffected. Matches the role-based `.tt-*` philosophy. |
