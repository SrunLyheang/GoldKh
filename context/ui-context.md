# UI Context

Design direction: **Vault**. Dark, warm-toned, gold-accented. This is
the **default** theme and the one every design decision below is written
against. As of 2026-08-27 it is no longer the only theme — see
**Theming** immediately below.

## Theming

The dashboard supports multiple selectable themes. Vault is the default.
Six ship as of 2026-08-27:

Each theme is a distinct *personality*, not just a recolour — corners,
elevation language, and heading/label typography all diverge:

| Theme | Personality | Corners | Elevation | Headings / labels |
| --- | --- | --- | --- | --- |
| **Vault** | Brutalist ledger (default) | square `0` | hard 4px offset plate | sans UPPER tight 700; mono UPPER labels; `[ … ]` brackets |
| **Ledger** | Editorial `minimalist-ui` | `8px` | soft blur, tiny | **serif** (Newsreader) normal 500; mono UPPER labels; no brackets |
| **Midnight** | Soft glass | round `16px` | **large blue glow, no card borders** | sans **normal-case light 300**, airy; **sans** UPPER labels `0.04em`; no brackets |
| **Emerald** | Chunky | very round `20px` | soft green-tinted glow | sans **UPPER heavy 800 −0.03em**; mono UPPER labels `0.1em`; no brackets |
| **Terminal** | CRT | square `0` | hard 5px offset **+ scanline `::after` layer** | **mono UPPER `0.18em`** everywhere incl. hero price; heavy `[ … ]`; grain `0.08` |
| **Porcelain** | Swiss / flat | crisp `3px` | **none — hairline border only** | sans **UPPER `0.12em` 600**; **sans** UPPER labels `0.14em`; no brackets |

Every `globals.css` theme block is written
`:root[data-theme="x"], [data-theme="x"]` (not `:root[...]` alone) so a
nested `<div data-theme="x">` resolves the full token set — that is what
lets the theme picker paint each swatch from the real theme. Vault also
gets an explicit `[data-theme="vault"]` selector for the same reason;
the provider still sets **no** attribute on `<html>` for Vault, so SSR
is unaffected.

The user plans to add more.

**Architecture — a CSS token contract, not forked components.**

- `lib/theme/theme-context.tsx` — `ThemeProvider` + `useTheme()`,
  `localStorage` key `goldkh-theme`, defaults to `"vault"`, mirrors
  `LocaleProvider` (starts on the default every render, reads the stored
  value in an effect, so no hydration mismatch). Sets `data-theme` on
  `document.documentElement`; `"vault"` sets **no attribute**. Exports a
  `THEMES` registry (`{ id, label }[]`).
- `ThemeToggle` (`components/dashboard/theme-toggle.tsx`) — registry-
  driven, in the sidebar footer and the mobile top bar next to
  `LanguageToggle`. A `Popover` (the shadcn one) whose trigger shows a
  two-chip swatch + current theme name, opening a 2-col grid of **live
  preview swatches**. Each swatch is a mini mockup wrapped in
  `<div data-theme={id}>` — it paints from that theme's real tokens
  (including `--radius` and `--shadow-*`), so nothing hardcodes a
  colour and a new `THEMES` entry renders correctly with zero change
  here. Went through `SegmentedControl` → `Select` → this popover as
  the registry grew.
- `app/globals.css` — the bare `:root` block is Vault. Each other theme
  is one `:root[data-theme="<id>"]` block overriding **only tokens**.
  Beyond the usual shadcn colors, `:root` now carries **idiom tokens**
  so the Industrial-Brutalism specifics are theme-swappable without
  touching a single component:

  | Token group | Vault value | Consumed by |
  | --- | --- | --- |
  | `--label-font/-transform/-tracking` | mono, uppercase, `0.08em` | `.tt-label` |
  | `--heading-font/-transform/-tracking/-weight` | sans, uppercase, `-0.01em`, 700 | `.tt-heading` |
  | `--display-font` | `var(--font-mono)` | `.tt-display` (hero price only) |
  | `--bracket-open` / `--bracket-close` | `"[ "` / `" ]"` | `.tt-bracket::before/::after` |
  | `--shadow-lg` / `--shadow-sm` | hard `4px/2px` offset | `.shadow-vault-lg/-sm` |
  | `--radius` | `0px` | every `rounded-*` utility |

  The `[ … ]` framing on section titles and the Live/Stale label is now
  pseudo-element content from the bracket tokens — **not** literal
  characters in JSX — so a theme blanks it by setting the tokens to
  `""`.

**Adding a theme:** one `THEMES` entry + one `:root[data-theme="<id>"]`
block. No component changes. If a theme needs the grain overlay tuned,
add a `:root[data-theme="<id>"] .vault-grain::before { … }` rule. Light
themes (Ledger, Porcelain) share one such rule — dark overlay grain
becomes a faint `multiply` on paper; Terminal has its own that raises
opacity for the CRT look.

**Newsreader** (`next/font/google`, `--font-newsreader`) is loaded in
the root layout but referenced only by the Ledger theme's heading/
display tokens; Vault never renders it.

Everything from here down describes the **Vault** theme specifically.
Confirmed — Vault itself is the decided design, not a proposal.

## Theme

Dark only. No light mode. Warm near-black backgrounds rather
than neutral gray, with a single gold accent carrying every
interactive element, the live price, and the chart line. Green
and red appear only where they carry financial meaning — gains,
losses, buy and sell direction. They are never decorative.

## Colors

All components use these tokens. No hardcoded hex values.

| Token                    | Hex       | Role                                         |
| ------------------------ | --------- | -------------------------------------------- |
| `--background`           | `#0f0c08` | Page background                              |
| `--card`                 | `#151009` | Card and panel fill                          |
| `--card-foreground`      | `#f5f1e8` | Text on cards                                |
| `--popover`              | `#151009` | Modal and dropdown fill                      |
| `--popover-foreground`   | `#f5f1e8` | Text in modals and dropdowns                 |
| `--foreground`           | `#f5f1e8` | Primary text                                 |
| `--muted-foreground`     | `#a89a82` | Labels, secondary text, timestamps           |
| `--muted`                | `#1c1610` | Subtle fills — icon chips, inactive states   |
| `--border`               | `#2a2013` | Card borders, dividers                       |
| `--input`                | `#2a2013` | Input borders                                |
| `--ring`                 | `#e8b84b` | Focus ring                                   |
| `--primary`              | `#e8b84b` | Gold accent — CTAs, price, active nav, chart |
| `--primary-foreground`   | `#1a1207` | Text on gold buttons                         |
| `--secondary`            | `#1c1610` | Secondary button fill                        |
| `--secondary-foreground` | `#f5f1e8` | Text on secondary buttons                    |
| `--accent`               | `#221a10` | Hover fill for nav items and rows            |
| `--accent-foreground`    | `#f5f1e8` | Text on hover fill                           |
| `--destructive`          | `#f87171` | Sell badges, losses                          |
| `--state-gain`           | `#4ade80` | Gains, live indicator dot                    |

`--state-gain` is not a shadcn token — declare it alongside
them. `--destructive` doubles as the loss color; do not add a
separate token for financial direction.

`--muted`, `--accent`, `--secondary`, `--popover`,
`--card-foreground`, `--ring` and the two `-foreground` pairs
were derived from the Vault palette to complete the shadcn set,
so generated components work unmodified. Adjust if any look
wrong in place.

## Typography

Geist Sans for UI. Geist Mono with tabular figures for numbers.

| Use               | Size        | Weight  | Font |
| ----------------- | ----------- | ------- | ---- |
| Hero price        | 46px        | 600     | Mono |
| Stat card value   | 19px        | 600     | Mono |
| Section title     | 15px        | 600     | Sans |
| Nav item / body   | 13.5px      | 500     | Sans |
| Stat label / meta | 11.5–12.5px | 400–500 | Sans |

**Every price, quantity, cost basis, and gain/loss figure uses
the mono tabular class. No exceptions — including inside
buttons, chart axis labels, and timestamps.** Proportional
digits shift column alignment between rows and make a table of
prices measurably harder to scan. This is a correctness rule
about reading numbers, not a style preference.

## Border Radius

Set `--radius: 12px` so shadcn's scale lands on these values.

| Element                      | Radius | Class        |
| ---------------------------- | ------ | ------------ |
| Hero card, chart card        | 16px   | `rounded-xl` |
| Stat cards, transaction rows | 12px   | `rounded-lg` |
| Icon chips (buy/sell badge)  | 10px   | `rounded-md` |
| Buttons, small controls      | 8px    | `rounded-sm` |

## Component Library

shadcn/ui on top of Tailwind. Components live in
`components/ui/`. Add new components with the CLI rather than
writing them from scratch, and treat what the CLI generates as
generated code.

## Layout Patterns

**Shell** — Fixed 236px left sidebar holding the logo and nav
(Dashboard, History), beside a flexible main content
area with `30px 36px` padding.

**Hero price card** — Full width. A 3px gold gradient bar across
the top, then a split row: on the left, a label above the large
mono headline price **per damlung** (not per ounce — damlung is
the unit the user thinks in day to day), then a secondary row
showing spot per ounce and price per chi. On the right, the live
"as of" timestamp — a green dot beside a mono time — stacked
above a Refresh button. A live 24h % change was originally
planned here but is not implemented — see progress-tracker.md's
Open Questions.

A one-line disclaimer belongs near the price header: local
Cambodian gold shops sell above spot, so a position may show as a
"loss" against spot that is really dealer premium, not an actual
loss. Placement confirmed via a 2026-08-26 grilling session — a
one-liner here, not a more prominent first-login notice, even
though the app is open to public signup. Exact copy is still not
decided — a UI copy detail, not a blocked decision.

**Stat row** — Four equal columns, 16px gap. Each card is a
muted 11.5px label, over a 19px mono value at weight 600, over a
12px mono muted sub-line. The gain/loss card colors both its
value and sub-line green or red. The row carries a section header
— an `<h2>` styled as `.tt-heading .tt-bracket text-[15px]
text-foreground`, reading "Position" — above the four-card grid,
matching the Transaction History and Price History section headers.

**Realized panel** — Full-width `Panel size="lg"` between the stat
row and the transaction history, in the same 32px block rhythm.
**Rendered only when the user has at least one USD sell**
(`computeRealized(...).saleCount > 0`) — before the first sale the
dashboard is unchanged. Deliberately the same shape as the hero
price card: left readout (a `.tt-label` line — `[ REALIZED ]`
bracket eyebrow + "from N sales" — over a 34/40px mono value, over
a mono percent sub-line), right a `--muted-foreground` caption
capped at ~34ch, `sm:text-right`, stacking under the value below
`sm`. So the dashboard opens and closes on two matching full-width
readouts (spot price / realized result) with the stat chips
between. Value + percent take the gain/loss tone; **exactly $0 is
neutral** ("broke even"). Everything routes through `Panel`,
`.tt-label`, `MonoValue`'s `tone`, and the state tokens, so it
themes with no per-theme rule. Realized figure is weighted-average
(`lib/calc/realized.ts`), not FIFO.

**Transaction history** — Header row with the title and a gold
"Add transaction" button carrying an icon and label. Below it, a
real `<table>` in a `max-height: 320px` scroll container (both
axes — narrow viewports scroll horizontally too), sticky header
row. Columns: Date (with the buy/sell icon chip — green
down-left arrow for buy, red up-right for sell), Quantity, Paid,
price/damlung, Current Value, P&L (colored green/red, "—" for
sell rows and non-USD rows — see `lib/calc/transactionRow.ts`),
delete. Delete is a trash icon that swaps in-place to
Delete/Cancel buttons on click — no modal.

**Price history chart** — Full width, below the transaction
history. A 220px Recharts line chart of `price_snapshots` over
time, converted to price/damlung to match the hero card's unit.
Gold (`--primary`) line, muted dashed `CartesianGrid`, no axis
lines (`axisLine={false}`), muted-foreground tick labels. When
the user holds a position, a dashed `--muted-foreground`
`ReferenceLine` marks their average cost — same "dashed
break-even line" idea as the disclaimer's dealer-premium note,
carried over from an earlier version of this app. Renders an
empty-state message instead of a chart when fewer than 2 points
exist yet, since `price_snapshots` only gains rows as users load
the dashboard (no backfill — see progress-tracker.md).

**Add transaction dialog** — Single-column, generously spaced
(`gap-6` between fields, not a cramped 2-column grid). Buy/Sell
is a two-button segmented toggle, not a dropdown — a binary
choice doesn't need one. Quantity+unit and price+currency are
each one row (input + compact `Select`). Restrained borders, no
heavy shadows, per the minimalist-ui skill's principles applied
within the existing Vault tokens (not its literal light palette,
which would clash with this dark theme).

**Mutation feedback** — After add/edit/delete transactions, the
dashboard reconciles via a React `useTransition` so the route-level
`loading.tsx` never flashes. A 2px `--primary` indeterminate bar
under the Transaction History header signals the in-flight sync
(static dimmed bar under `prefers-reduced-motion`). Success is
a single Sonner toast; the inline success banner was removed, and
`InlineBanner` is now error-only.

**Spacing rhythm** — 32px (28px on mobile) vertical gap between
major blocks (hero → stats → transactions → chart). 20–28px padding
inside cards (`md`/`lg` `Panel` sizes respectively). 12px between
list rows. Widened from the original 26px/16–18px/10px figures in a
2026-08-27 pass for more breathing room — see progress-tracker.md's
"Spacing pass" entry.

**Empty states** — Every list has one. A new user's first screen
is an empty dashboard, and it must tell them what to do. The empty
dashboard now lists the three-step how-it-works flow above the CTA.

## Stale Price

Resolved. When `isSnapshotStale()` (`lib/price/getPrice.ts`) is
true, the hero card's dot switches from `--state-gain` to
`--muted-foreground` and the "Live" label becomes "Stale" —
implemented in `components/dashboard/hero-price-card.tsx`. Not
amber or red: a stale price isn't an error, and doesn't carry
gain/loss meaning.

## States Not Yet Designed

These need a visual treatment before the dashboard is complete:

- **Long transaction lists.** The scroll container is defined,
  but not what a user with 200 rows sees — pagination, or
  scroll alone.

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4` inline,
`h-5 w-5` in buttons.

## Responsive Breakpoints

Added 2026-08-26. The Layout Patterns section above described a
desktop-fixed-width shell; below `md` (768px) it now adapts instead
of just letting the table scroll horizontally.

**Shell** — `DashboardShell` (`components/dashboard/dashboard-shell.tsx`)
replaces the old inline `Sidebar` + `main` markup in
`app/dashboard/layout.tsx`. Below `md`, `Sidebar` becomes a
slide-in overlay drawer (`-translate-x-full` / `translate-x-0`,
`transition-transform`) behind a hamburger button in a slim top bar;
a dark backdrop (`bg-black/60`) closes it on click, same as a nav
link click. At `md` and above, `md:translate-x-0` forces it visible
and `md:w-59` restores the fixed 236px width — `open`/`onClose` are
no-ops there. `main` carries `md:ml-59` to reserve the space the
`fixed` sidebar occupies once it's back in flow-adjacent position.

**Stat row** — Two columns below `lg` (1024px), four from `lg` up.
Four columns at `md` (768px) was tried and rejected: labels and
mono values wrapped onto multiple lines in the cramped ~150px
columns. Two columns has enough width all the way from phone to
tablet.

**Hero price card** — Stacks vertically below `sm` (640px)
(`flex-col`, price block above the live/stale timestamp), and the
headline price drops from 46px to 34px so it doesn't force the card
wider than the viewport. From `sm` up it's the original horizontal
split.

**Transaction history** — Below `md`, the `<table>` is replaced
entirely by a stacked card list (one `Panel` per transaction: an
icon/type/date/actions row on top, a 2-column grid of Paid/damlung/
Current Value/P&L below). This is a real layout switch, not a CSS
reflow of the same markup — a data table's columns don't have a
sensible single-column stacking order, so `TransactionCard` is a
separate component sharing row-computation logic (`getRowDisplay`)
with the desktop `Row`. At `md` and above, the original table
returns unchanged, horizontal scroll included — that documented
behavior was for narrow *desktop* windows, not phones, and stays as
originally designed there.

**Reusable primitives** — introduced to stop the card wrapper, mono
number styling, and gain/loss coloring from drifting across desktop
and mobile variants of the same data:

- `Panel` (`components/dashboard/panel.tsx`) — the
  `rounded-* border border-border bg-card` wrapper, `size="lg"`
  (hero/chart, `rounded-xl p-6`, `p-4` below `sm`) or `size="md"`
  (stat cards, transaction cards; default).
- `MonoValue` (`components/dashboard/mono-value.tsx`) — the
  `font-mono tabular-nums` span, with a `tone` prop
  (`foreground`/`muted`/`gain`/`loss`) instead of each call site
  hand-rolling the same three-way ternary. Includes `break-all` as
  a safety net so an unusually large figure wraps inside its card
  instead of overflowing it. A `signed` prop reserves a fixed-width
  sign cell so `-$285.00` and `$285.00` align on the first digit.
  The P&L card and Realized panel also pass `signed` to the percent
  sub-line, so the value and percent stay flush.
- `toneFromAmount` (`lib/format/tone.ts`) — `Number(amount) >= 0 ?
  "gain" : "loss"`, replacing the duplicated ternary in `StatRow`
  and `TransactionHistory`.
- `InlineBanner` (`components/dashboard/inline-banner.tsx`) — the
  error/success message strip in `TransactionHistory`.

**Auth pages** — `sign-in`/`sign-up` add `px-4 py-8` around the
Clerk widget so it doesn't touch the viewport edge on narrow
screens. The widget itself is Clerk's default responsive layout,
unchanged.
