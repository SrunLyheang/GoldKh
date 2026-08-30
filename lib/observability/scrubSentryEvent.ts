import type { Event } from "@sentry/nextjs";

const REDACTED = "[redacted]";

// `beforeSend` / `beforeSendTransaction` hook for both the server and
// browser Sentry SDKs. Strips the fields Sentry attaches by default that
// can carry user PII:
//   - `request.data` — the request body. The transaction `notes` field is
//     free text a user may fill with names, account numbers, or amounts.
//   - `request.cookies` / `request.headers` — the Clerk session cookie and
//     any auth headers, which identify the user.
//   - `request.query_string` and the query portion of `request.url` — a
//     query string can carry ids, search terms, or tokens.
//   - `breadcrumbs` — Sentry's automatic `fetch` / `xhr` / `console`
//     breadcrumbs record full request URLs (with their query strings) and
//     any values passed to `console.*`. Dropped wholesale; if their triage
//     value is ever needed, scrub each crumb's `message` / `data` rather
//     than deleting the array.
// Method and the path portion of the URL are kept: useful for triage and
// treated as low-risk.
export function scrubSentryEvent<T extends Event>(event: T): T {
  if (event.request) {
    if ("data" in event.request) {
      event.request.data = REDACTED;
    }
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.query_string;
    if (typeof event.request.url === "string") {
      event.request.url = stripQueryAndFragment(event.request.url);
    }
  }
  delete event.breadcrumbs;
  return event;
}

// Keep scheme + host + path, drop everything from the first `?` or `#`.
function stripQueryAndFragment(url: string): string {
  const cut = url.search(/[?#]/);
  return cut === -1 ? url : url.slice(0, cut);
}
