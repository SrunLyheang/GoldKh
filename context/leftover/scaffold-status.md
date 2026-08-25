# Scaffold Status (setup task, not a feature unit)

Tracks progress on the one-time project scaffolding task from
AGENTS.md/the original setup prompt — separate from
`progress-tracker.md`, which tracks the `price_snapshots` /
feature work that starts *after* this is done. Delete this file
once step 7 passes.

## Original task steps

1. Init Next.js + TypeScript (App Router, strict TS). **Done.**
2. Install/configure Tailwind, shadcn/ui, Clerk,
   `@neondatabase/serverless`, Drizzle (ORM only, no schema),
   Zod, Geist Sans/Mono. **Done.**
3. `clerkMiddleware`, deny-by-default, comment marking where
   public routes go, no public routes added. **Not started** —
   drafted but not written to disk when the session was
   interrupted; still needs `middleware.ts` at the repo root.
4. Folder structure exactly per architecture.md's System
   Boundaries: `app/`, `lib/db/`, `lib/price/`,
   `lib/price/providers/`, `lib/calc/`, `lib/constants/`,
   `components/`, `components/ui/`. One-line `README.md` in each
   empty `lib/` folder quoting its owning line from
   architecture.md. **Not started.**
5. Drizzle connection wired to Neon's pooled connection string
   from an env var (pooled, never direct — architecture.md
   invariant 9). Empty schema file, `drizzle.config.ts` pointing
   at it. `.env.example` with Clerk keys, Neon connection string,
   price provider API key names — no real values. **Not started.**
6. Vault design tokens into `app/globals.css` + shadcn theme
   config (full color table, 12px radius scale, Geist Sans/Mono).
   No components beyond shadcn CLI base primitives. **Done** —
   folded into step 2's work: `app/globals.css` has the full
   Vault palette (dark-only, `.dark` block removed), `--radius:
   12px`, `--state-gain` added; `app/layout.tsx` wires
   `GeistSans`/`GeistMono` via the `geist` package.
7. Confirm `npm run build` passes on the empty scaffold.
   **Not started.**

## What's already on disk

- `package.json` — name `goldkh`. Deps: `next`, `react`,
  `react-dom`, `@clerk/nextjs`, `@neondatabase/serverless`,
  `drizzle-orm`, `zod`, `geist`. Dev deps include `drizzle-kit`,
  Tailwind v4, ESLint.
- `components.json` — shadcn `base-nova` preset, Lucide icons,
  aliases `@/components`, `@/lib`, `@/hooks`.
- `components/ui/button.tsx`, `lib/utils.ts` — shadcn CLI output.
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css` — from
  `create-next-app --empty`, globals.css since edited for Vault
  tokens.
- `lib/constants/units.ts` — pre-existing before this scaffold
  task started (unit conversion constants); not part of this
  task's scope, left untouched.
- `node_modules/` installed, `npm install` has been run twice
  successfully.

## Remaining work, in order

1. Write `middleware.ts` — `clerkMiddleware`, `createRouteMatcher([])`
   (empty = nothing public), `auth.protect()` when not matched,
   with a comment marking where public routes would be added. Draft
   was already composed in the interrupted session; matcher config
   excludes Next internals and static assets, plus `/(api|trpc)(.*)`.
2. Create folder structure + `lib/*/README.md` stubs quoting
   architecture.md's System Boundaries lines verbatim.
3. `lib/db/schema.ts` (empty except a comment), `drizzle.config.ts`
   pointing at it and reading `DATABASE_URL` from env, `.env.example`
   with `DATABASE_URL`, Clerk publishable/secret keys, and price
   provider API key env var names — no real values.
4. Run `npm run build`; fix anything that fails on the empty
   scaffold only (no business logic).
5. Update `context/progress-tracker.md`: move this scaffold out of
   "In Progress" and confirm "Next Up" item 1 is still
   `price_snapshots` table + migration (it already is — just
   confirm nothing here changed that).
6. Show the user the full file tree and an install summary before
   they review details, per the original request. Then delete this
   file.

## Notes for whoever resumes this

- Do not write real schema, `getPrice()`, or `lib/calc` logic —
  that's explicitly out of scope for this task per
  `ai-workflow-rules.md`'s scoping rules; stop if a step starts
  drifting into real columns or real function bodies.
- `.gitignore` (from create-next-app) ignores `.env*` wholesale;
  add a `!.env.example` negation line so the example file can
  still be committed.
- Nothing has been committed yet — working tree is dirty with all
  of the above.
