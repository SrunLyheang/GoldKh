# GoldKh 🪙

> Track your personal gold holdings against live market prices. Log your buys and sells in Cambodian units (_chi_ and _damlung_), and see your weighted-average cost, market value, and gains over time.

**GoldKh is a personal portfolio tracker, not an exchange.** No money moves through it—you record transactions made elsewhere, and the dashboard does the math against live gold prices.

---

## ✨ Features

- **Cambodian Units** — Enter and view holdings in _chi_ and _damlung_
- **Weighted Average Cost** — Selling reduces quantity while keeping your average cost accurate
- **Always Available** — Shows the last known price if live data is temporarily unavailable
- **No Sign-Up** — Open the app and start logging. Your ledger is tied to your device, with a recovery code to open it on another

---

## 📱 Pages

| Page             | What it shows                                                        |
| ---------------- | -------------------------------------------------------------------- |
| **Dashboard**    | Live price, your position stats, realized gains, transaction history |
| **Price Chart**  | Full-screen interactive spot-price chart with zoom and range presets |
| **Insights**     | Portfolio value over time, per-buy quality, what-if calculator       |
| **Transactions** | Filterable table with row detail, CSV import/export                  |
| **Settings**     | Recovery code, display preferences, themes, data export              |

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16 + React 19
- **Database:** Neon PostgreSQL + Drizzle ORM
- **Identity:** anonymous device id in an httpOnly cookie (no accounts)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Charts:** Recharts 3
- **Hosting:** Vercel

---

## 🚀 Quick Start

**Prerequisites:** Node.js 24.x, Neon database, goldapi.io key

```bash
npm install
cp .env.example .env.local        # Add your keys
npx drizzle-kit migrate           # Set up database
npm run dev
```
