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

- Live gold price sourced from external providers
  (goldapi.io, Binance PAXG/USDT).
- Multiple providers tried in order, so exhausting one free
  tier does not take the dashboard down.
- Prices cached in the database; external providers are only
  contacted when the cached value is stale.
- Every displayed price carries the timestamp it was captured
  at.

### Dashboard and Calculation

- Total holdings, expressed in chi and damlung.
- Weighted average cost across all buys.
- Current market value at the latest cached price.
- Unrealized gain/loss in absolute and percentage terms.

A sell reduces quantity and leaves the average cost per unit
unchanged — proceeds don't touch the basis of what remains.
Worked example: hold 10 chi at a $300 average cost, sell 3. You
now hold 7 chi, still at a $300 average cost.

## Scope

### In Scope

- Clerk-authenticated multi-user accounts.
- Buy and sell transaction recording with full history.
- Weighted average cost basis.
- Cached, multi-provider gold price fetching.
- Display in USD and in Cambodian gold units (chi, damlung).

### Out of Scope

- KHR display and USD-to-KHR conversion — deferred; the price
  layer stores USD only and conversion will be added later.
- FIFO or per-lot cost basis. Weighted average only.
- Realized gain/loss and tax reporting.
- Price alerts, notifications, and the Telegram bot.
- Sharing, collaboration, or any multi-owner data.
  -Payment systems
- A native mobile app.
- Field-level encryption of holdings data.

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
