# GoldKh

> Track personal gold holdings against the live spot price — log your buys and
> sells in Cambodian units, and see weighted-average cost, market value, and
> realized/unrealized gain over time.

GoldKh is a **multi-user web app**, not an exchange. No money moves through it:
you record transactions you made elsewhere, and the dashboard does the math
against a cached live gold price. Anyone can sign up.

- **Units** — you enter and view holdings in *chi* and *damlung*. Prices are
  stored canonically as USD per troy ounce and converted for display.
- **Cost basis** — weighted average, not FIFO. Selling reduces your quantity and
  leaves the average cost per unit unchanged.
- **Always a price** — the dashboard shows the last known price with an "as of"
  timestamp instead of an error, even if every price source is down.

---

## Table of contents

- [Screens](#screens)
- [Stack](#stack)
- [How it fits together](#how-it-fits-together)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Theming](#theming)
- [Design principles](#design-principles)
- [Contributing](#contributing)
- [Documentation](#documentation)

---

## Screens

| Route | What it shows |
| --- | --- |
| `/` · `/welcome` | Marketing landing (redirects to the dashboard once you're signed in) |
| `/dashboard` | Live price, your position stats, realized gains, transaction history, price chart |
| `/dashboard/price` | Full-screen interactive spot-price chart with range presets and drag-to-zoom |
| `/dashboard/insights` | Plain-language readouts, portfolio value over time, per-buy quality, a what-if calculator |
| `/dashboard/transactions` | Full filterable and sortable table, row detail, CSV import/export |
| `/dashboard/settings` | Account management, display preferences (unit, theme), data actions |

Every route except the landing and auth pages is private.

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) 16 (App Router) + [React](https://react.dev) 19 |
| Language | TypeScript 5 (`strict`) |
| Styling | [Tailwind CSS](https://tailwindcss.com) v4, [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com), [Lucide](https://lucide.dev) icons, Geist fonts |
| Auth | [Clerk](https://clerk.com) |
| Database | [Neon](https://neon.tech) serverless Postgres + [Drizzle ORM](https://orm.drizzle.team) |
| Charts | [Recharts](https://recharts.org) 3 |
| Motion | [`motion`](https://motion.dev) 13 |
| Money math | [`decimal.js`](https://mikemcl.github.io/decimal.js/) — no floating point |
| Validation | [Zod](https://zod.dev) 4 |
| Errors | [Sentry](https://sentry.io) (optional) |
| Tests | [Vitest](https://vitest.dev) 4 + Testing Library |
| Hosting | [Vercel](https://vercel.com) |

---

## How it fits together

One Next.js repo, split into modules that each own a single concern:

| Module | Responsibility |
| --- | --- |
| `app/` | Routes, pages, and API handlers — request parsing, auth, and response shaping only |
| `lib/db/` | Database schema, migrations, and every query |
| `lib/price/` | The price layer: provider modules (goldapi.io, Binance PAXG), rotation, staleness, and caching, behind a single `getPrice()` |
| `lib/calc/` | Pure functions for cost basis, holdings, gain/loss, and unit conversion — no I/O |
| `components/` | UI — receives already-computed values as props |

**Request flow:** a server component reads the database directly, hands plain
data to one client component per route, and changes are saved through `/api/*`
handlers followed by a refresh. There's no client-side data-fetching library.

**Price handling:** external providers are called only on a cache miss. A
snapshot older than 30 minutes counts as stale; a manual refresh within 5
minutes of the last one is on cooldown. Snapshots are append-only and written
when the dashboard loads — there's no scheduled job.

---

## Project structure

```text
app/
  dashboard/            Main app — layout, page, price/insights/transactions/settings
  api/                  Route handlers (transactions, price refresh, account, Clerk webhook)
  sign-in/  sign-up/    Clerk auth pages
  welcome/  page.tsx    Marketing landing
components/
  dashboard/            Dashboard UI (hero card, stat row, transaction history, charts…)
  charts/               DetailedChart — the reusable Recharts time-series chart
  insights/  transactions/  welcome/  auth/  effects/
  ui/                   Generated shadcn / Base UI primitives
lib/
  db/                   schema.ts, migrations/, queries/
  price/                providers/, freshness, rotation, cache
  calc/                 holdings, gainLoss, realized, portfolioSeries, buyQuality, units… (pure)
  format/  i18n/  theme/  prefs/  ui/  api/  env.ts
context/                Product, architecture, UI, and workflow docs
CONTEXT.md              Domain glossary
```

---

## Data model

Three Postgres tables (`lib/db/schema.ts`). Every money and quantity column is
`numeric` — never a float.

| Table | Purpose |
| --- | --- |
| `transactions` | One row per buy/sell: type, quantity, unit (`chi` / `damlung`), price per unit, currency (`USD` / `KHR`), date, notes. Belongs to one signed-in user. |
| `price_snapshots` | Append-only price cache: USD per troy ounce, source, manual flag, capture time. Shared by everyone. |
| `rate_limit_counters` | Per-user throttling for manual price refreshes. |

Your holdings, average cost, and gain/loss are recalculated on every load from
your transactions — never stored as their own row.

---

## Getting started

**You'll need:** Node.js 24.x, npm, a [Neon](https://neon.tech) database, a
[Clerk](https://clerk.com) application, and a
[goldapi.io](https://www.goldapi.io) API key.

```bash
npm install
cp .env.example .env.local        # fill in your own keys (see below)
npx drizzle-kit migrate           # apply migrations to your database
npm run dev
```

Open <http://localhost:3000>.

---

## Environment variables

Validated at startup — a missing or malformed **required** value stops the
process before it serves a request.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Neon **pooled** connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✅ | Clerk frontend key |
| `CLERK_SECRET_KEY` | ✅ | Clerk backend key |
| `GOLDAPI_IO_API_KEY` | ✅ | Price provider key |
| `CLERK_WEBHOOK_SIGNING_SECRET` | — | Needed only for the Clerk webhook endpoint |
| `NEXT_PUBLIC_SENTRY_DSN` | — | Leave unset to turn off error tracking |

---

## Database migrations

The schema lives in `lib/db/schema.ts`. Migrations are generated with
`drizzle-kit` and applied by hand — never from a build step.

```bash
npx drizzle-kit generate      # create a migration from schema changes
npx drizzle-kit migrate       # apply pending migrations to $DATABASE_URL
```

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Lint with ESLint |
| `npm run test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |

---

## Testing

[Vitest](https://vitest.dev) with Testing Library. Test files sit next to the
code they cover, and `lib/calc/` — the money math — is the most thoroughly
tested part of the codebase.

```bash
npm run test
```

---

## Deployment

- **Hosting** — Vercel. Real secrets live in Vercel's environment settings.
- **CI** — GitHub Actions runs lint, tests, and a build on every pull request
  and on pushes to `main`. A failing check blocks merge.
- **Migrations** — run manually against the database before the deploy that
  needs them.

---

## Theming

Six themes ship and are switched at runtime: **Vault** (default), Ledger,
Midnight, Emerald, Terminal, and Porcelain. Each redefines a set of CSS
tokens — colours, corner radius, shadows, typography — and components only ever
read those tokens, so themes stay consistent everywhere. Vault is dark and
gold-accented; green and red show up only where they mean a gain or a loss.

---

## Design principles

A few rules the codebase holds to:

- Only the price layer talks to an external price provider.
- Every query for your data is scoped to your session — a user id from the
  request is never trusted.
- Holdings and gain/loss are always derived, never stored.
- Prices are stored in one unit (USD per troy ounce); everything else is a
  display-time conversion.
- No floating point for money or quantities.
- API keys are read only on the server.

The full set is in [`context/architecture.md`](context/architecture.md).

---

## Contributing

1. Fork and branch off `main`.
2. Make your change; keep it focused.
3. Make sure `npm run lint`, `npm run test`, and `npm run build` all pass.
4. Open a pull request.

Issues and discussion:
[github.com/SrunLyheang/GoldKh](https://github.com/SrunLyheang/GoldKh).

---

## Documentation

| Path | Contents |
| --- | --- |
| [`context/`](context) | Product scope, architecture, UI conventions, and coding standards |
| [`CONTEXT.md`](CONTEXT.md) | Domain glossary — the terms the project uses and what they mean |
