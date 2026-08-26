import * as Sentry from "@sentry/nextjs";

// Sentry.init with an undefined dsn is a documented no-op — safe in every
// environment before NEXT_PUBLIC_SENTRY_DSN is configured.
//
// No onRouterTransitionStart export here — @sentry/nextjs (10.71.0) has
// no captureRouterTransitionStart yet for this Next.js 16.3
// instrumentation-client.ts hook. Optional per Next's docs; revisit when
// the SDK catches up.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
