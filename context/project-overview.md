# GoldKh

## Overview

Not an exchange. No money moves through this system.

A multi-user web application for tracking personal gold
holdings against the live spot price. A signed-in user
records their gold buys and sells in Cambodian units
(chi, damlung), and the dashboard computes their weighted
average cost, current market value, and unrealized gain or
loss. It replaces the earlier single-user version where
holdings were hardcoded into the source.

**Audience: open public signup, not a gated/trusted circle.**
Confirmed via a grilling session on 2026-08-26 — the multi-user
rebuild exists so other people can track their own gold, not just
the developer. Anyone can create an account; it isn't being
actively promoted yet, but the app should be treated as if a
stranger could sign up at any time. This raises the bar on every
"acceptable for personal use" tradeoff elsewhere in the context
files — see `progress-tracker.md`'s Architecture Decisions for
what that changed (rate limiting priority, UI test coverage).

## Goals

1. A signed-in user can record buy and sell transactions
   and see an accurate weighted average cost and unrealized
   gain/loss derived from them.
2. The dashboard always displays a gold price with a visible
   "as of" timestamp, and never shows an error or blank state
   because an upstream price API was unavailable.
3. External price API usage stays constant as the number of
   users grows, rather than scaling with users or page loads.

## Core User Flow

1. User signs in via Clerk.
2. User lands on the dashboard. If they have no transactions
   yet, an empty state prompts them to record their first buy.
3. User records a buy: quantity, unit (chi or damlung), price
   paid, and date.
4. Dashboard displays total holdings, weighted average cost,
   current market value at the live price, and unrealized
   gain/loss.
5. User records a sell against their holdings, which reduces
   the position.
6. User reviews their full transaction history.

## Features

### Authentication and Accounts

- Sign in and sign up handled entirely by Clerk.
- All application routes are private by default; unauthenticated
  requests are rejected before reaching any handler.
- A user's data is visible only to that user.

### Transactions

- Record a buy: quantity, unit, price paid, date.
- Record a sell: quantity, unit, price received, date.
- View full transaction history, newest first.
- Edit and delete corrections to previously recorded
  transactions.

### Price Layer

- Live gold price sourced from goldapi.io.
- Provider list is walked in order on cache miss — currently
  one provider, structured so a second can be added later
  without changing getPrice()'s rotation logic.
- Prices cached in the database; external providers are only
  contacted when the cached value is stale.
- Every displayed price carries the timestamp it was captured
  at.

### Dashboard and Calculation

- Total holdings, expressed in chi and damlung.
- Weighted average cost across all buys.
- Current market value at the latest cached price.
- Unrealized gain/loss in absolute and percentage terms.
- Realized gain/loss on gold already sold, on the same weighted
  average basis (proceeds minus the average cost of the sold
  quantity). Added 2026-08-30 — see `progress-tracker.md`.

A sell reduces quantity and leaves the average cost per unit
unchanged — proceeds don't touch the basis of what remains.
Worked example: hold 10 chi at a $300 average cost, sell 3. You
now hold 7 chi, still at a $300 average cost.

## Scope

### In Scope

- Clerk-authenticated multi-user accounts.
- Buy and sell transaction recording with full history.
- Full transactions route (`/dashboard/transactions`): every row, with
  amount / date / quantity / direction filtering and Date / P&L sort.
- Row-level detail: a dashboard/route transaction row expands in place to
  show full date, per-unit price, spot on that date, notes, and the P&L
  breakdown.
- CSV import and export of transactions (dashboard panel and the full
  route), bulk insert capped at 200 rows per import.
- Weighted average cost basis.
- Realized gain/loss on sold gold, weighted average basis.
- Cached, multi-provider gold price fetching.
- Display in USD and in Cambodian gold units (chi, damlung).
- Insights view (`/dashboard/insights`): plain-language readouts,
  portfolio value over time, per-buy quality vs spot, and a what-if
  calculator — all derived at read time from the ledger and stored
  price snapshots.
- Settings (`/dashboard/settings`): Clerk account management, display
  preferences (default unit and theme, browser-local — currency stays
  USD-only until KHR display lands, so it is not a user choice yet), and
  destructive data actions (export, delete all transactions, delete
  account).

### Out of Scope

- KHR display and USD-to-KHR conversion — deferred; the price
  layer stores USD only and conversion will be added later.
- FIFO or per-lot cost basis. Weighted average only.
- Tax reporting — Cambodia has no gold capital-gains regime to
  report against.
- Price alerts, notifications, and the Telegram bot.
- Sharing, collaboration, or any multi-owner data.
  -Payment systems
- A native mobile app.
- Field-level encryption of holdings data.
- Terms of Service / Privacy Policy. Explicitly skipped per the
  user (2026-08-26 hardening grilling session), despite open public
  signup — see `progress-tracker.md`'s Architecture Decisions.

## Success Criteria

1. A signed-in user can record a buy, refresh the page, and
   see their holdings and average cost persisted correctly.
2. A second signed-in user sees only their own transactions,
   and cannot retrieve another user's data by manipulating a
   request.
3. With every external price provider failing, the dashboard
   still renders using the last cached price and displays how
   old it is.
4. Ten users loading the dashboard within the same cache window
   result in at most one external price API call.
5. Recording a sell reduces holdings and leaves the buy
   transactions untouched in the history.

These five are necessary but not sufficient. Confirmed via a
2026-08-26 grilling session: the real definition of "done" is
that people — not just the developer — actually rely on this
instead of a spreadsheet or memory, and trust the numbers enough
to act on them. Treat the criteria above as the floor, not the
finish line.
