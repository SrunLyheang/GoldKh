# GoldKh

Personal portfolio tracker for physical gold. Users log buys/sells made in
person at Cambodian gold shops (in chi / damlung); the dashboard derives
holdings, weighted-average cost, market value, and gain/loss against a cached
live spot price on every load. Not an exchange, not a wallet — no money moves
through it.

- **Product spec:** `PRODUCT.md`
- **Stack:** Next.js 16 / React 19, Neon Postgres + Drizzle, Clerk auth,
  Tailwind v4 + shadcn/ui, Recharts 3, Vercel.
- **Tests:** `npm test` (Vitest). The money math in `lib/calc/` is the most
  heavily tested part.

## Design System

Always read `DESIGN.md` before making any visual or UI decision. All font
choices, colors, spacing, the type scale, the 7 themes, motion, and the
stale-state spec are defined there. Do not deviate without explicit user
approval. In QA / review mode, flag any code that doesn't match `DESIGN.md`
— especially new `text-[Npx]` arbitrary sizes (use the `text-label` /
`text-figure` / … scale), hardcoded corners (use `--radius-*`), and any
staleness styled with `--destructive` instead of muted grey.
