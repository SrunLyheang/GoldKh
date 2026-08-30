import type { Event } from "@sentry/nextjs";

const REDACTED = "[redacted]";

// `beforeSend` / `beforeSendTransaction` hook for both the server and
// browser Sentry SDKs. Strips the request-scoped fields Sentry attaches by
// default that can carry user PII:
//   - `request.data` — the request body. The transaction `notes` field is
//     free text a user may fill with names, account numbers, or amounts.
//   - `request.cookies` / `request.headers` — the Clerk session cookie and
//     any auth headers, which identify the user.
// Method and URL are kept: useful for triage and low-risk (see
// context/security-review-2026-08-29.md, Finding 3, and its note that
// logging URLs is treated as safe).
export function scrubSentryEvent<T extends Event>(event: T): T {
  if (event.request) {
    if ("data" in event.request) {
      event.request.data = REDACTED;
    }
    delete event.request.cookies;
    delete event.request.headers;
  }
  return event;
}
