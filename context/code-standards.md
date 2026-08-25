# Code Standards

## General

- Keep modules small and single-purpose. A file that both
  fetches data and formats it for display is doing two jobs.
- Fix root causes. If a value arrives in the wrong shape,
  correct it where it enters the system, not at every place
  that consumes it.
- Keep calculation separate from I/O. Cost basis and gain/loss
  math lives in pure functions in `lib/calc/` that take numbers
  and return numbers.
- Do not mix system boundaries in one file. A route handler
  that queries the database and also calls a price provider is
  two changes waiting to conflict.

## TypeScript

- Strict mode is required throughout the project.
- Avoid `any`. Use explicit interfaces, or `unknown` plus a
  narrowing check at the boundary.
- Validate external input before trusting it, with Zod. This
  applies to request bodies and equally to responses from price
  providers — a provider returning HTTP 200 with an error body in
  the payload is a normal failure mode, not an edge case.
- Model money and quantity as a single explicit type rather
  than bare `number`, so a value in chi can never be silently
  passed where ounces are expected.

## Next.js

- Default to server components. Add `use client` only where
  browser interactivity genuinely requires it.
- Anything holding a secret — API keys, the refresh secret,
  database credentials — must live in a server component,
  server action, or route handler. Never in a client component,
  and never in a `NEXT_PUBLIC_` variable.
- Keep route handlers focused on one responsibility: parse,
  authorize, delegate, respond.
- `clerkMiddleware` runs deny-by-default. Public routes are an
  explicit allowlist. Route handlers still call `auth()`
  themselves rather than assuming middleware ran.

## Styling

- Use the CSS custom property tokens defined in
  `ui-context.md`. No hardcoded hex values in components.
- Follow the border radius scale in `ui-context.md` rather than
  choosing per-component values.
- Add shadcn/ui components via the CLI rather than writing them
  by hand.

## API Routes

- Parse and validate request input with Zod before any logic runs.
- Resolve the user ID from the Clerk server session as the first
  step of any handler touching user data. Never read it from the
  request.
- Enforce ownership before any mutation. A row must be confirmed
  to belong to the session user before it is updated or deleted,
  not merely referenced by an ID the client supplied.
- Every route returns one of exactly two shapes — never a bare
  value, never a differently-shaped error:

  ```ts
  { data: T } | { error: { code: string; message: string } }
  ```

- Do not leak provider names, stack traces, or database errors
  into a client-facing error response.

## Data and Storage

- All money and quantity columns are `numeric` with explicit
  precision and scale. Never `float`, `real`, or `double`.
- Store prices in one canonical unit: USD per troy ounce. Unit
  and currency conversion happens at display time.
- Store the source and capture timestamp alongside every cached
  price, so the UI can show staleness and you can identify which
  provider served a suspicious number.
- Derived values — holdings, average cost, gain/loss — are
  computed at read time from the ledger. They are not stored in
  their own mutable columns.
- Let the database arbitrate concurrency. When two requests
  could both trigger a price refresh, use a conditional insert
  or an advisory lock rather than a check-then-write in
  JavaScript.

## File Organization

- `app/` — Routes, pages, and route handlers.
- `components/` — Presentational and interactive UI.
- `components/ui/` — shadcn/ui generated primitives. Treated as
  generated code.
- `lib/db/` — Schema, migrations, and all queries.
- `lib/price/` — Price providers, rotation, caching, staleness.
- `lib/price/providers/` — One module per external provider,
  each returning the normalized internal shape or throwing.
- `lib/calc/` — Pure calculation and unit conversion functions.
- `lib/constants/` — Unit conversion factors (chi, damlung,
  troy ounce) and staleness thresholds.
