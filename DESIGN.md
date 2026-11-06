# Design System — GoldKh

> The family gold notebook. Canonical reference for every surface: the
> public landing page, sign-in / sign-up, and the signed-in app. Read it
> before any visual or UI change. Tokens live in `app/globals.css`.

---

## The idea

GoldKh is the notebook a family keeps for its gold: what was bought, at
which shop, for whom, and what it all adds up to today. Every screen is
a page of that notebook.

- **Feeling (the owner's words, 2026-11-06):** cosy and homely, like a
  family savings notebook. Dark by default, a notebook open under a lamp.
- **The memorable thing:** it always just works, and it reads like your
  own book. There's always a price with an honest time on it, and the
  sums are always right.
- **Voice:** plain, warm and precise, the way a careful relative would
  say it. Buttons are verbs ("Write an entry", "Save to the notebook").
  It explains the mechanism ("a weighted average, so a sale never changes
  what the rest cost you") and states limits honestly ("gold shops set
  their own prices, so yours may differ a little"). It never sells
  urgency.
- **Not a trading terminal.** No tickers, no telemetry type, no glowing
  numbers. Green and red mean gain and loss, and nothing else.

### The feeling table

| Layer | What "cosy family notebook" decides |
|---|---|
| Temperature | A warm umber desk with a paper page on it. Neutrals sit within ~40° of gold's hue. Both themes are warm. |
| Type | An account-book serif (Besley) for headings and the big figures, a calm reading sans for everything else, and the user's own notes in a handwriting face. |
| Rhythm | Unhurried. Rows sit on a 32px ruled line (`--line`), and groups are separated by space. |
| Shape | Paper: 22px page corners, 10px controls, binding holes and a margin rule on example pages. |
| First screen | An open two-page spread: today's price and position as a ruled-off sum on the left, recent entries on the right. |
| Motion | Calm in the app. Ink "writes" a new line and the sum's double rule re-draws (landing only). |
| Copy | "Bought 2 chi at $455 a chi", "What you hold", "Up so far", "Write an entry". |
| Sound | None (the owner chose no sound). |

---

## Themes: Night and Day

There are two designed themes (not recolours of one). Night is the default
and the server-rendered frame. Day is stored per device under
`goldkh-theme`, and a tiny boot script (`THEME_BOOT_SCRIPT` in
`lib/theme/theme-context.tsx`) applies it before first paint. The switch
lives in the header and in Settings.

| Token | Night | Day | Meaning |
|---|---|---|---|
| `--background` | `#1a1713` | `#e8deca` | the desk |
| `--page` | `#352f27` (L\*≈19) | `#fbf6ea` | the notebook page |
| `--sunk` | `#29241e` | `#f1eada` | wells: inputs, switches (one step below the page) |
| `--popover` | `#3e382f` | `#fffdf7` | things that float: menus, dialogs, toasts |
| `--foreground` | `#f3ead9` | `#1f2a44` | ink |
| `--muted-foreground` | `#c9bda6` | `#4b5268` | secondary text (7.5:1 / 7.2:1 on the page) |
| `--faint` | `#a3977f` | `#6b6e7c` | tertiary text (4.9:1 / 4.7:1 on the page) |
| `--gold` | `#e6b65a` | `#86580e` | gold as text and icon (the one accent) |
| `--gold-leaf` | `#e6b65a` | `#d9a441` | gold as a fill (the back cover, the range thumb) |
| `--ink-hand` | `#afc3ee` | `#2a4a8e` | ballpoint blue: the user's own words only |
| `--state-gain` | `#74c997` | `#21704a` | gain, and only gain |
| `--destructive` | `#f2907f` | `#ad3329` | loss, errors and deleting. Nothing else |
| `--rule` / `--margin-line` | faint blue / faint gold | same, tuned | the page's ruling and margin |

Primary text on the page is 11.7:1 (Night) and 13.2:1 (Day). Every pair
above clears WCAG AA, accents included.

Adding a theme is one token block in `globals.css` plus one entry in
`THEMES`. Components never read hex. The only fixed colours are the back
cover's `cover-ink` / `cover-paper`, which read the same in both themes.

---

## Typography

| Role | Face | Variable | Notes |
|---|---|---|---|
| Headings, the big figures | **Besley** (400–700) | `--font-ledger` → `font-serif`, `.tt-heading`, `.tt-display`, `.figure` | Clarendon-style, from the era of printed account books. Has tabular figures. |
| Reading: body, labels, tables, inputs | **Red Hat Text** (400–700) | `--font-reading` → `font-sans` | Open and warm, real tabular figures, unslashed zero. |
| The user's own words | **Shantell Sans** (INFM 60) | `--font-handwriting` → `.hand` | Notes and short margin remarks only, in `--ink-hand`. **Never a figure.** |
| Khmer script | **Kantumruy Pro** | `--font-khmer` | Fallback in every stack (ជី, ដំឡឹង, មាស). |

There is **no monospace**. `font-mono` points at the reading face, and
every figure gets `tabular-nums` (through `MonoValue`, kept under its old
name).

### Scale (semantic names, rem-based so text zoom works)

| Utility | px | Use |
|---|---|---|
| `text-micro` | 12 | chart ticks only |
| `text-label` | 13 | labels, metadata, status lines |
| `text-detail` | 14 | secondary body, table cells |
| `text-body` | 16 | body copy (line-height 1.5) |
| `text-emphasis` | 18 | emphasized body, notebook rows |
| `text-figure` | 22 | section headings (h2), figures in a sum |
| `text-figure-lg` | 32 | page titles, the bottom line |
| `text-display` / `-lg` | 44 / 60 | today's price (phone / desktop) |
| `text-hero` | clamp(40–72) | the landing headline only |

No `text-[Npx]` arbitrary sizes.

---

## Structure: space first, lines last

- **Surfaces.** `.page` is a notebook page (paper tone, faint ruling,
  22px corners, a soft page shadow). `.page--plain` is the same without
  ruling, for forms, settings and charts. `.page-margin` draws the margin
  rule. `.glass-overlay` (legacy name) is anything that floats: one step
  lighter plus `--shadow-float`, with no blur and no gradient ring.
- **The separation ladder.** Space, then alignment, then tonal surface
  (`--sunk` / `--popover`), then elevation (floating things only), and a
  line last.
- **A line means something.** Lines are allowed in only three places:
  - dense tables (the Ledger, Buy history), as hairlines from
    `--glass-border-to`;
  - the ruled paper itself (`--rule`);
  - the accountant's sum (`.ledger-sum`): a single rule over a total and
    a double rule under it.
- **No boxes inside boxes.** A page holds content directly. The old
  stat cards, readout tiles and settings panels are gone.
- **Corners (concentric):** `--radius-xl` 22 (pages, sheets) →
  `--radius-lg` 14 (popovers, toasts) → `--radius-md` 10 (buttons, inputs)
  → `--radius-sm` 6 → `--radius-xs` 4. Round (`rounded-full`) is only
  for dots, the theme switch, round icon buttons and chips.
- **Control heights:** 36 (`sm`), 40 (default), 48 (`lg`). Every target
  is ≥ 44px or carries `.tap-target`.

### Layouts

| Surface | Form |
|---|---|
| Shell | The wordmark (GoldKh + មាស), with **index tabs** standing on the page below (Today, Ledger, Price, Insights, Settings). On phones the tabs are a **bottom tab bar** in thumb reach. Night/Day, account and sign-out sit top right. |
| Today (`/dashboard`) | **The open spread.** The left page has the status line, "Gold today", the price, the shop-price note, then "What you hold": the weight said the shop's way ("2 damlung 5 chi"), four ledger lines, the ruled-off "Up so far", and the realized note in the user's hand. The right page has recent entries (max 7, edit/delete on each) and a link to the Ledger. Below the spread, "Gold over time" sits on its own page. On phones the pages stack and "Write an entry" floats above the tab bar. |
| Ledger | One plain page: title, count, Select and Import/Export, the filters, then a dense ruled table (compact rows on phones). Buys and sells are told apart in words, never in green/red. |
| Price | One plain page: title, today's price, the freshness line, the full chart and the shop-price note. |
| Insights | Two rows of differently weighted pages. First, figures down the margin beside "Your gold over time". Then "Buy history" beside a "What if…" scratch pad. |
| Settings | One page. Each group has its name and a sentence on the left and its rows on the right, separated by space. |
| Sign in / up | The notebook's inside cover: a gold-leaf flyleaf ("This notebook belongs to ____") beside the form page. |
| Landing (`/`) | The notebook itself (see below). |

### The landing page

The **hero** is an example page the visitor can write in
(`components/welcome/example-notebook.tsx`):

- They add lines ("Bought 3 chi at $500 a chi"), cross lines out, and
  watch the sum re-total with a fresh double rule.
- They move "If gold were…" to re-value the same gold.
- It is labelled as an example, saves nothing, and its price is marked
  indicative.
- It has a full keyboard path, its form errors are tied to their inputs,
  and results are announced in a live region.

After the hero come the back pages, one job each:

- Chi & damlung: a drawing of ten chi leaves = one 37.5 g damlung, plus
  the fixed conversions.
- "You write it down. It keeps the sums." in a ledger's two columns.
- "What GoldKh is not."
- A gold-leaf back cover with the sign-up.

There is no invented social proof and no fabricated figures.

---

## Motion

Level: **Standard** in the app, **Expressive** on the landing (one
signature moment). Tokens are in `globals.css`.

| Token | Value | Use |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | entering, leaving, most UI |
| `--ease-in-out` | `cubic-bezier(0.77, 0, 0.175, 1)` | something on screen moving |
| `--ease-drawer` | `cubic-bezier(0.32, 0.72, 0, 1)` | sheets (the entry dialog on phones) |
| `--dur-press` / `-micro` / `-small` / `-medium` / `-large` / `-hero` | 120 / 160 / 200 / 280 / 380 / 600ms | press, hover/colour, menus, toasts/page entrance, sheets, the ink moment |

- **Presses press.** `.press` scales to 0.97 on pointer-down.
- **Page entrance.** One short fade-and-settle (`.dash-enter`, 280ms)
  that plays from SSR markup, so nothing waits on hydration.
- **The number policy.**
  - Figures land on their value. They do **not** roll up from zero on
    every visit, because data you read every day doesn't move for style.
  - The one exception is "Up so far", which rolls (900ms) from the value
    you last saw to today's, because that change is the news.
  - A changed figure flashes its tone once (`.value-pulse-active`) and
    snaps.
  - A unit toggle snaps.
- **Ink.** `.ink-write` (a clip-path reveal, 520ms) when a new line is
  written. `.ink-underline` re-draws the sum's rules.
- **Phone dialogs** rise as a bottom sheet and leave the way they came.
- **Reduced motion:** fades stay, movement goes, and ink appears at once.
- **Never:** `ease-in` on UI, `transition: all`, `scale(0)`, animated
  width/height/top/left, cursor glow, tilt, magnetic buttons or sparkle
  fields.

---

## Degraded & stale states

The price is always present (see `PRODUCT.md`). Freshness is a quiet line
with a dot and words, never an alarm:

| State | Dot | Words |
|---|---|---|
| Fresh (< 30 min) | `--state-gain` | **Up to date** · as of 6:43 PM |
| Stale (≥ 30 min) | `--faint` | **Last known price** · as of 6:43 PM |
| Market closed | — | extra line: "Market closed — prices resume Monday." |

Never `--destructive` for staleness. Red means loss.

- **Refresh** is a gold text button. During cooldown it stays visible,
  dims, says why on hover, and toasts the wait time.
- **Empty:** the right page becomes "A clean page", with three numbered
  steps, a faint example line in handwriting, and "Write an entry".
- **Loading:** a skeleton of the real spread (`app/dashboard/loading.tsx`),
  not a spinner.
- **Mutations:** optimistic, and reconciled inside a transition. "Syncing…"
  shows under Recent entries. Failures arrive as a toast in words.

---

## Charts

Recharts 3. Horizontal gridlines only, in the hairline colour, so they
read as the page's ruling. Ticks use the reading face at 12px.

| Slot | Token | Semantic |
|---|---|---|
| `chart-1` | gold | the primary series (spot price, portfolio value) |
| `chart-2` | ballpoint blue | the secondary series (cost basis) |
| `chart-3` / `chart-4` | gain / loss | gain or loss segments |
| `chart-5` | ink | the "now" marker |

The average-cost line is dashed `--muted-foreground`. The draw-on runs
600ms on first mount only, and not under reduced motion.

---

## Accessibility (WCAG 2.2 AA)

- Contrast as in the token table, in both themes.
- A skip link on the shell and the landing, plus one `:focus-visible`
  ring (`2px var(--ring)`).
- `aria-current="page"` on the active tab.
- Switches use `aria-pressed` / `role="switch"`. Form errors use
  `aria-invalid` and `aria-describedby`. Dynamic results are announced in
  live regions.
- Colour is never the only signal. Gain/loss carry a sign and words ("Up
  so far"), buys/sells carry words, and freshness carries words.
- Text sizes are in rem. Targets are ≥ 44px. Safe-area insets are
  respected on the bottom bar and sheets.

---

## Decisions log (taste record)

| Date | Decision | Why |
|---|---|---|
| 2026-09-03 | DESIGN.md created (7 themes, liquid glass, mono figures) | `/design-consultation`. Superseded below. |
| 2026-11-06 | **Redesign: the family gold notebook** | The owner asked for a redesign of the dashboard, every page and the landing with Unslop Design 1.6. Interview answers: feeling **cosy / homely**, reference **a family savings notebook**, **replace** the 7-theme / glass / mono system, motion **Standard in the app, Expressive on the landing**, **no sound**. |
| 2026-11-06 | **Take A, the open spread**, chosen from three first-screen takes | Rejected: B (one page ending in a balance) and C (a price sticky note beside the notebook). |
| 2026-11-06 | **Dark by default** (Night), with Day kept as a designed second theme | The owner chose "darker by default" over the paper-first palette. |
| 2026-11-06 | **The user's notes in handwriting**, figures never | The owner said yes to handwriting for their own words. |
| 2026-11-06 | Figures no longer roll up from zero on every visit | Frequency rule: a daily check-in shouldn't wait on decoration. "Up so far" still rolls from the last-seen value. |
| 2026-11-06 | Buys/sells labelled in words, not green/red icons | Green and red carry gain/loss only. |
| 2026-11-06 | Fixed: a riel row's per-unit price was printed with "$" | Found in the Phase 0 review (`getRowDisplay.perUnitLabel`). |
