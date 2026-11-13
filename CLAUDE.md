# GoldKh

Personal portfolio tracker for physical gold. Users log buys/sells made in
person at Cambodian gold shops (in chi / damlung); the dashboard derives
holdings, weighted-average cost, market value, and gain/loss against a cached
live spot price on every load. Not an exchange, not a wallet — no money moves
through it.

- **Product spec:** `PRODUCT.md`
- **Stack:** Next.js 16 / React 19, Neon Postgres + Drizzle, Tailwind v4 +
  shadcn/ui, Recharts 3, Vercel. No auth provider: identity is an anonymous
  device id in an httpOnly cookie (`lib/identity/`, set in `proxy.ts`).
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
