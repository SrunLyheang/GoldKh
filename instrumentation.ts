import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/observability/scrubSentryEvent";

export function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const runtime = process.env.NEXT_RUNTIME;

  if (!dsn || (runtime !== "nodejs" && runtime !== "edge")) {
    return;
  }

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

export const onRequestError = Sentry.captureRequestError;
