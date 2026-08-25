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
mono price with its percentage change, then a secondary row
showing spot per ounce and price per chi. On the right, the live
"as of" timestamp — a green dot beside a mono time — stacked
above a Refresh button.

A one-line disclaimer belongs near the price header: local
Cambodian gold shops sell above spot, so a position may show as a
"loss" against spot that is really dealer premium, not an actual
loss. Exact copy is not yet decided — a UI copy detail, not a
blocked decision.

**Stat row** — Four equal columns, 16px gap. Each card is a
muted 11.5px label, over a 19px mono value at weight 600, over a
12px mono muted sub-line. The gain/loss card colors both its
value and sub-line green or red.

**Transaction history** — Header row with the title and a gold
"Add transaction" button carrying an icon and label. Below it, a
scrollable list — `max-height: 280px`, `overflow-y: auto`. Each
row: an icon chip on the left (buy is a green down-left arrow,
sell a red up-right arrow) followed by description, date, and
amount paid; value and colored mono gain/loss right-aligned.

**Spacing rhythm** — 26px vertical gap between major blocks
(hero → stats → transactions). 16–18px padding inside
cards. 10px between list rows.

**Empty states** — Every list has one. A new user's first screen
is an empty dashboard, and it must tell them what to do.

## States Not Yet Designed

These need a visual treatment before the dashboard is complete:

- **Stale price.** The green dot signals live. When the cached
  price is hours old because every provider failed, the dot and
  timestamp need a distinct treatment — muted or amber, not
  green, and not red, since it is not an error. The dashboard
  still renders normally.
- **Negative gain/loss alignment.** The minus sign occupies a
  character cell. Right-aligned mono columns need a consistent
  approach so positive and negative values line up.
- **Long transaction lists.** The scroll container is defined,
  but not what a user with 200 rows sees — pagination, or
  scroll alone.

## Icons

Lucide React. Stroke-based icons only. Sizes: `h-4 w-4` inline,
`h-5 w-5` in buttons.
