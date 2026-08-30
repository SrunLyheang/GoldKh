# Security Review — 2026-08-29

Full-app security audit (not just a branch diff). Overall result: the
security fundamentals are solid — server-side session auth on every route,
ownership scoped in the `WHERE` clause, Drizzle-parameterised queries, zod
on every mutating body, no XSS sinks, no secrets in git. Findings below are
hardening / low-severity, **not** a live breach.

This file is the cross-session handoff. Work the items **in order**. Each is
small and independently verifiable per `ai-workflow-rules.md`'s "When to
Split Work". After finishing one: run `npm run lint && npm run test &&
npm run build`, then tick it here and add a one-line note to
`progress-tracker.md`.

---

## Status

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | CSP provides no real protection + missing headers | Low (defense-in-depth) | **DONE 2026-08-29** (2 follow-ups still open — see below) |
| 2 | Transaction existence oracle (403 vs 404) | Low | **DONE 2026-08-29** |
| 3 | Sentry may capture financial PII in error events | Low / Medium | **DONE 2026-08-29** |
| 4 | `GET /api/transactions` has no rate limit | Low | **DONE 2026-08-29** |

All four findings addressed 2026-08-29. Verified: `npm run lint` clean,
`npm run test` 167/167, `npx tsc --noEmit` clean, `next build` exit 0.
The only remaining work is the two Finding 1 follow-ups (nonce-based
`script-src`, production Clerk domain) — see below.

---

## Finding 1 — Content-Security-Policy — DONE 2026-08-29

**File:** `next.config.ts`

**Was:** `Content-Security-Policy: frame-ancestors 'self'` only — a
clickjacking directive with no `default-src` / `script-src`. `X-Powered-By:
Next.js` exposed. No `Permissions-Policy`.

**Done in this pass:**
- Real CSP: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`, `frame-ancestors 'self'`, plus an explicit
  allowlist per directive (`script-src` / `style-src` / `img-src` /
  `font-src` / `connect-src` / `frame-src` / `worker-src`) scoped to the
  origins Clerk, Sentry, and Cloudflare Turnstile actually use.
- `'unsafe-inline'` is **still allowed on `script-src`** — removing it needs
  per-request nonce plumbing (see follow-up below). Everything else is
  locked down, so an injected `<script src="evil.com">` is now blocked even
  though inline script is not yet.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `poweredByHeader: false` in `nextConfig`.

**Follow-up still open (do NOT skip when picking this up again):**
1. **Nonce-based `script-src`.** Wrap `clerkMiddleware()` in `proxy.ts` so
   it generates a per-request nonce, sets it on a request header, and the
   root layout reads it via `headers()` and passes `nonce` to any inline
   `<script>` / to `<ClerkProvider>`. Then drop `'unsafe-inline'` from
   `script-src` and add `'strict-dynamic'`. Verify Clerk sign-in/up,
   the dashboard, and the Recharts chart all still render with **zero**
   CSP violations in the browser console.
2. **Production Clerk domain.** The allowlist covers
   `https://*.clerk.accounts.dev` + `https://*.clerk.com` (dev/preview).
   When the prod Clerk instance + custom domain exist (architecture.md
   first-deploy checklist steps 1-2), add the production Frontend API
   origin (`https://clerk.<prod-domain>`) to `script-src` and
   `connect-src`.
3. **Sentry ingest origin.** ~~`connect-src` allows the `*.sentry.io`
   wildcards.~~ **DONE 2026-08-29 (b):** `sentryIngestOrigin()` in
   `next.config.ts` derives the single ingest origin from
   `NEXT_PUBLIC_SENTRY_DSN` (`https://<host>` of the DSN URL) and
   `connect-src` allows exactly that — empty, with Sentry disabled, when
   no DSN is set.
4. **`img-src` host allowlist.** **DONE 2026-08-29 (b):** replaced the
   broad `https:` image source with `data: blob: https://img.clerk.com`
   — Clerk avatars are the only remote images the app loads; every
   `next/image` call otherwise points at a local asset.
5. Consider shipping a stricter `Content-Security-Policy-Report-Only`
   header first in prod and watching Sentry/console for violations before
   tightening the enforcing one.

---

## Finding 2 — Transaction existence oracle (403 vs 404) — DONE 2026-08-29

**Done:** `classifyMiss` deleted; `OwnedMutation` reduced to
`{ ok: true; value } | { ok: false }` (no `reason`);
`updateOwnedTransaction` / `deleteOwnedTransaction` return `{ ok: false }`
on any ownership-scoped miss. `app/api/transactions/[id]/route.ts` now
returns an identical `404 NOT_FOUND` for both "no such row" and "another
user's row" (helper renamed `ownershipError` → `notFound`). Tests updated
in `transactions.test.ts` and `[id]/route.test.ts` — the ex-"403" cases
now assert the two misses produce byte-identical 404 bodies.

Original writeup:

**Files:** `lib/db/queries/transactions.ts` (`classifyMiss`),
consumed by `app/api/transactions/[id]/route.ts` PATCH + DELETE.

**Problem:** When a PATCH/DELETE matches no row for the session user,
`classifyMiss` does a second **unscoped** lookup and returns `403
"forbidden"` if the id exists under another user, vs `404 "not_found"` if
it doesn't. An authenticated attacker can therefore tell "this transaction
UUID belongs to someone else" apart from "unused UUID". No row content
leaks, and ids are UUIDv4 (unguessable), so impact is low — but the
distinction is pointless.

**Fix:**
- Delete `classifyMiss` and the `"forbidden"` branch of `OwnedMutation`.
- `updateOwnedTransaction` / `deleteOwnedTransaction` return a plain
  `{ ok: false }` (or keep `reason` but only ever `"not_found"`) when the
  ownership-scoped write returns no row.
- `ownershipError` in the route collapses to always `apiError("NOT_FOUND",
  "Transaction not found", 404)`.
- Update `route.test.ts` + `queries/transactions.test.ts` — the
  "other user's row -> 403" cases become "-> 404".

**Verify:** full test suite, then manually: PATCH/DELETE a random UUID and
a (if reachable) known other-user id — both must return an identical 404
body.

---

## Finding 3 — Sentry may capture financial PII — DONE 2026-08-29

**Done:** new pure helper `lib/observability/scrubSentryEvent.ts` —
redacts `event.request.data` to `"[redacted]"` and deletes
`event.request.cookies` / `event.request.headers` (keeps method + URL).
Wired as `beforeSend` **and** `beforeSendTransaction` in both
`instrumentation.ts` and `instrumentation-client.ts`, alongside
`sendDefaultPii: false`. Both `Sentry.init` calls are now explicitly
gated on `NEXT_PUBLIC_SENTRY_DSN` being set (no more relying on the
"undefined dsn is a no-op" behaviour). Unit test
`scrubSentryEvent.test.ts` covers the redaction and the no-request
no-op. Not done (optional, deferred): a Sentry-dashboard server-side
data-scrubbing rule as defense-in-depth.

Original writeup:

**Files:** `instrumentation.ts`, `instrumentation-client.ts`.

**Problem:** `Sentry.init` is called with no `sendDefaultPii`, no
`beforeSend`, no body scrubbing. `@sentry/nextjs` by default can attach
request data, IP, and user context. `transactions.notes` is free text (up
to 500 chars) where a user may record names / account numbers / amounts;
if a transaction route throws, that body can land in Sentry, visible to
anyone with project access.

**Fix (both init call sites):**
- Set `sendDefaultPii: false` explicitly.
- Add a `beforeSend` (and `beforeSendTransaction`) that strips request
  bodies and any `notes`-shaped field from the event
  (`event.request?.data`, breadcrumbs).
- Gate `Sentry.init` on `process.env.NEXT_PUBLIC_SENTRY_DSN` being set so
  local/dev never sends at all (currently relies on the "undefined dsn is
  a no-op" behaviour — make it explicit).
- Optionally enable Sentry server-side data scrubbing / an advanced
  data-scrubbing rule for `notes` as defense-in-depth.

**Verify:** unit-test the `beforeSend` with a synthetic event carrying a
`notes` field and assert it's removed. `npm run build` + `next start`
clean with and without a DSN.

---

## Finding 4 — `GET /api/transactions` has no rate limit — DONE 2026-08-29

**Done:** `GET` now uses `withAuthAndRateLimit` (was `withAuth`), sharing
the existing per-user 20-req / 5-min budget with the writes. Safe because
the dashboard reads the list through the server component
(`lib/db/queries` directly), so this route has no in-app client caller.
`lib/constants/rateLimit.ts` comment updated; `route.test.ts` gains a GET
429 case.

Original writeup:

**File:** `app/api/transactions/route.ts:9`

`GET` uses `withAuth` only; `withAuthAndRateLimit` guards the writes.
Flagged only because the review checklist named rate limiting — it is not
a vulnerability (auth still required, DoS is out of scope for the review).

**Fix (if wanted):** wrap `GET` in `withAuthAndRateLimit` too, or add a
separate higher read-tier limit constant so a read burst doesn't consume
the write budget. Update `route.test.ts`.

---

## Explicitly checked and OK (do not re-litigate)

- Secrets: `.env*` gitignored except empty `.env.example`; nothing
  sensitive in git history; CI uses labelled placeholder env values.
- Auth: `app/dashboard/layout.tsx` gate + `withAuth` on every route;
  `userId` always from the Clerk server session, never the client
  (architecture.md invariants 2 & 8).
- IDOR on mutations: ownership enforced in the SQL `WHERE`
  (`and(eq(id), eq(userId))`), not post-fetch filtering.
- SQL injection: Drizzle parameterised throughout, including the one raw
  `sql\`\`` in `insertSnapshotIfStale` (bound params, provider-validated
  values only).
- XSS: no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval`; React
  auto-escaping.
- CSRF: Clerk session cookie is `HttpOnly` + `Secure` + `SameSite=Lax`;
  no custom cookie auth.
- CORS: no CORS headers set -> same-origin only.
- HTTPS: HSTS `max-age=63072000; includeSubDomains`; Vercel terminates TLS.
- Debug: Sentry `tracesSampleRate: 0.1`, no `debug: true`; all API errors
  are generic (no stack traces / provider names / DB errors leak).
- Webhook: `app/api/webhooks/clerk/route.ts` verifies the svix signature,
  handles only `user.deleted`, 200s unknown events to avoid retry storms.
