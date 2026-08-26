import * as Sentry from "@sentry/nextjs";

// Sentry.init with an undefined dsn is a documented no-op — safe to call
// unconditionally in every environment (local dev, CI, and production
// before NEXT_PUBLIC_SENTRY_DSN is configured in the Sentry dashboard).
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
