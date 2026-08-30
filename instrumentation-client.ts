import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/observability/scrubSentryEvent";

// Explicitly gate on the DSN rather than leaning on "Sentry.init with an
// undefined dsn is a no-op" — nothing initialises unless error tracking is
// actually configured for this environment.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    // Do not attach IP address or user identifiers by default.
    sendDefaultPii: false,
    // Strip request body / cookies / headers from every event — the
    // transaction `notes` field can carry PII. See
    // context/security-review-2026-08-29.md, Finding 3.
    beforeSend: scrubSentryEvent,
    beforeSendTransaction: scrubSentryEvent,
  });
}
