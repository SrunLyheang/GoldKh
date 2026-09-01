# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users think in **chi** and **damlung** and treat physical gold as
savings, not a trading instrument:

- **Local holders in Cambodia** who buy and sell at local gold shops and want
  their weighted-average cost and standing between visits.
- **Cambodian diaspora / remote holders** holding gold back home, tracking its
  value in familiar units against the global spot price.

The shared job: "I bought gold at a shop — record it, tell me what my position
is worth and whether I'm up or down." Sessions are short and check-in-shaped:
open the dashboard, read price and position, leave. Multi-user, not single-tenant.

## Product Purpose

GoldKh lets a person log physical-gold buys and sells made elsewhere and see, on
every load, total holdings, weighted-average cost, current market value, and
realized / unrealized gain against a cached live spot price. It exists because
the alternatives — a notebook, a spreadsheet, or a brokerage app built around
troy ounces and USD — either do the cost-basis math by hand or force the wrong
mental units. Success is a user trusting the position figure enough to stop
keeping their own tally.

## Positioning

- **Not an exchange and not a wallet.** No money moves through GoldKh. It records
  real-world transactions; it never executes, custodies, or quotes a tradable
  price. Future work must never make it look or behave like a trading platform.
- **Cambodian units are the product lens.** Users enter and read holdings in chi
  and damlung. USD per troy ounce is an internal storage unit only, surfaced
  solely as a display-time conversion.
- **Always a price.** The dashboard shows the last known price with an "as of"
  timestamp rather than an error, even when every upstream source is down.
- **Weighted-average cost, not FIFO.** Selling reduces quantity and leaves average
  cost per unit unchanged.

## Operating Context

- Gold is bought and sold in person at Cambodian gold shops, which price
  differently from the global spot rate; the app shows a standing disclaimer that
  local buy/sell prices won't match exactly.
- Transactions are entered after the fact, in chi or damlung, priced in USD or
  KHR, with a date and optional notes.
- The spot price is cached and shared across all users. Providers (goldapi.io,
  Binance PAXG) are called only on a cache miss. A snapshot older than 30 minutes
  is stale; a manual refresh within 5 minutes of the last is on cooldown.
  Snapshots are append-only, written on dashboard load — no scheduled job.
- Signed-in surfaces: dashboard (price, position stats, realized gains,
  transaction history, price chart), full-screen price chart, insights
  (plain-language readouts, portfolio value over time, per-buy quality, what-if
  calculator), full transactions table with CSV import/export, and settings
  (account, display preferences, data actions). The landing page at `/` is the
  only marketing surface and redirects to the dashboard once signed in.

## Capabilities and Constraints

- **Derived, never stored.** Holdings, average cost, and gain/loss are recomputed
  from the user's transactions on every load, never persisted.
- **One canonical price unit.** Prices are stored as USD per troy ounce; every
  other unit or currency is a display-time conversion.
- **No floating point for money or quantities** — decimal arithmetic throughout;
  every money/quantity database column is `numeric`.
- **Server-owned identity.** Every query for a user's data is scoped to their
  Clerk session; a user id from the request is never trusted.
- **Price layer is the only outbound.** Only `lib/price/` talks to an external
  price provider; API keys are read only on the server.
- **Transaction shape:** type (buy/sell), quantity, unit (chi/damlung), price per
  unit, currency (USD/KHR), date, notes. Manual price refreshes are rate-limited
  per user.
- **Localization:** English only ships today. A Khmer locale and its toggle were
  built and removed (2026-08-29) pending a translation review; re-adding a second
  locale is a known, scoped path (`lib/i18n/`), not a rewrite. Unit labels
  (chi/damlung) are already first-class.
- **Undesigned:** pagination / virtualization for transaction lists of hundreds
  of rows — currently scroll-only.

## Brand Commitments

- Name: **GoldKh**.
- Voice (observed in product copy and README, the working standard until the user
  says otherwise): plain, precise, unhyped. Explains the mechanism ("weighted
  average, not FIFO"), states limits honestly ("your local price may not match"),
  never sells urgency. Financial green / red carry meaning only — gain or loss —
  never decoration.
- Repository: github.com/SrunLyheang/GoldKh.

## Evidence on Hand

- A real, working application (Next.js 16 / React 19, Clerk auth, Neon Postgres,
  deployed on Vercel). The money math in `lib/calc/` is the most thoroughly
  tested part of the codebase.
- **No user base, testimonials, customer counts, press, or usage metrics.** A
  personal project that has not been promoted. Future design or marketing work
  must not fabricate social proof, adoption numbers, or named users.
- Signed-in design system: `context/ui-context.md`. Product/architecture
  decisions: `context/progress-tracker.md`.

## Product Principles

1. **Record-keeping, not trading.** Every feature serves "understand a position I
   already hold," never "make a move now."
2. **Speak the user's units.** Chi and damlung are the default lens; conversions
   are shown, not imposed.
3. **Never fail to a blank.** Degrade to the last known price with an honest
   timestamp before showing an error.
4. **The math must be trustworthy.** Derived on every load, decimal-exact,
   consistent everywhere a figure appears.
5. **Short visits are the point.** The dashboard is a check-in — the fastest path
   to price and position beats depth.

## Accessibility & Inclusion

No formal standard is set as a product requirement. Existing practice to
preserve: every motion effect has both a `prefers-reduced-motion` path and a
touch / small-viewport path, and financial figures snap rather than re-roll on
data change.
