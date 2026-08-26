# UI Context

Design direction: **Vault**. Dark, warm-toned, gold-accented.
Confirmed — this is the decided design, not a proposal.

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
value and sub-line green or red.

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

**Spacing rhythm** — 32px (28px on mobile) vertical gap between
major blocks (hero → stats → transactions → chart). 20–28px padding
inside cards (`md`/`lg` `Panel` sizes respectively). 12px between
list rows. Widened from the original 26px/16–18px/10px figures in a
2026-08-27 pass for more breathing room — see progress-tracker.md's
"Spacing pass" entry.

**Empty states** — Every list has one. A new user's first screen
is an empty dashboard, and it must tell them what to do.

## Stale Price

Resolved. When `isSnapshotStale()` (`lib/price/getPrice.ts`) is
true, the hero card's dot switches from `--state-gain` to
`--muted-foreground` and the "Live" label becomes "Stale" —
implemented in `components/dashboard/hero-price-card.tsx`. Not
amber or red: a stale price isn't an error, and doesn't carry
gain/loss meaning.

## States Not Yet Designed

These need a visual treatment before the dashboard is complete:

- **Negative gain/loss alignment.** The minus sign occupies a
  character cell. Right-aligned mono columns need a consistent
  approach so positive and negative values line up.
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
  instead of overflowing it.
- `toneFromAmount` (`lib/format/tone.ts`) — `Number(amount) >= 0 ?
  "gain" : "loss"`, replacing the duplicated ternary in `StatRow`
  and `TransactionHistory`.
- `InlineBanner` (`components/dashboard/inline-banner.tsx`) — the
  error/success message strip in `TransactionHistory`.

**Auth pages** — `sign-in`/`sign-up` add `px-4 py-8` around the
Clerk widget so it doesn't touch the viewport edge on narrow
screens. The widget itself is Clerk's default responsive layout,
unchanged.
