import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Origins the browser is allowed to load code/data from, kept as named
// groups so each directive below reads as a list, not a wall of URLs.
//   - Clerk serves its Frontend API + hosted UI from *.clerk.accounts.dev
//     (dev/preview) and *.clerk.com. The production custom-domain origin
//     (clerk.<prod-domain>) must be added here once it exists.
//   - Cloudflare Turnstile (challenges.cloudflare.com) backs Clerk's bot
//     protection and renders in an iframe.
//   - Sentry posts events straight to one ingest host encoded in the DSN
//     (`https://<key>@<host>/<project>`); we allow exactly that origin,
//     nothing wildcard. No DSN set -> no Sentry origin (and Sentry.init
//     is a no-op anyway).
//   - Clerk also serves user / OAuth avatar images from img.clerk.com;
//     that is the only remote image host the app loads.
const clerkOrigins = "https://*.clerk.accounts.dev https://*.clerk.com";
const clerkImageOrigin = "https://img.clerk.com";
const turnstileOrigin = "https://challenges.cloudflare.com";

function sentryIngestOrigin(): string {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return "";
  try {
    return `https://${new URL(dsn).host}`;
  } catch {
    return "";
  }
}
const sentryOrigins = sentryIngestOrigin();

// `next dev` (Turbopack HMR + React dev-mode stack reconstruction) evaluates
// code with eval(), which CSP blocks unless 'unsafe-eval' is present. Scope it
// to development only so the production policy stays eval-free.
const devScriptSrc =
  process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

// 'unsafe-inline' is still permitted on script-src: Next.js injects inline
// bootstrap/hydration scripts and there is no per-request nonce plumbed
// through yet. Everything else is locked to 'self' + the allowlist above,
// so an injected external <script src> is already blocked. Removing
// 'unsafe-inline' (via a per-request nonce) is still open.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  `script-src 'self' 'unsafe-inline'${devScriptSrc} ${clerkOrigins} ${turnstileOrigin}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${clerkImageOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${clerkOrigins} ${sentryOrigins}`,
  `frame-src 'self' ${clerkOrigins} ${turnstileOrigin}`,
  "worker-src 'self' blob:",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project. Without it,
  // Turbopack walks up and finds a stray package-lock.json in the
  // home directory, making root inference ambiguous (it warns and
  // guesses). __dirname is this file's directory = the repo root.
  turbopack: {
    root: __dirname,
  },
  // Don't advertise the framework/version in a response header.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// No org/project/authToken set — source-map upload is skipped until
// SENTRY_AUTH_TOKEN etc. are configured after the Sentry project exists.
// `silent: true` avoids Sentry's build-time console noise until then.
export default withSentryConfig(nextConfig, {
  silent: true,
});
