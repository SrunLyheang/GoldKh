import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Origins the browser is allowed to load code/data from, kept as named
// groups so each directive below reads as a list, not a wall of URLs.
//   - Clerk serves its Frontend API + hosted UI from *.clerk.accounts.dev
//     (dev/preview) and *.clerk.com. A production instance on a custom
//     domain serves clerk-js + the Frontend API from clerk.<prod-domain>
//     instead; that host is encoded in the publishable key, so we decode
//     it (see clerkFrontendApiOrigin) rather than hardcoding it.
//   - Cloudflare Turnstile (challenges.cloudflare.com) backs Clerk's bot
//     protection and renders in an iframe.
//   - Sentry posts events straight to one ingest host encoded in the DSN
//     (`https://<key>@<host>/<project>`); we allow exactly that origin,
//     nothing wildcard. No DSN set -> no Sentry origin (and Sentry.init
//     is a no-op anyway).
//   - Clerk also serves user / OAuth avatar images from img.clerk.com;
//     that is the only remote image host the app loads.

// The Frontend API host is base64url-encoded in the publishable key:
// `pk_(test|live)_<base64url("<host>$")>`. Clerk's own SDK derives its
// script/API origin this way, so a production custom domain
// (clerk.goldkh.xyz) needs no extra env var — decode the same value the
// browser will call and add it to the allowlist.
function clerkFrontendApiOrigin(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return "";
  const encoded = key.replace(/^pk_(test|live)_/, "");
  try {
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const host = decoded.replace(/\$$/, "");
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : "";
  } catch {
    return "";
  }
}
const clerkFrontendApi = clerkFrontendApiOrigin();

const clerkOrigins =
  `https://*.clerk.accounts.dev https://*.clerk.com ${clerkFrontendApi}`.trim();
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

// KNOWN GAP — script-src still allows 'unsafe-inline'. Next.js injects
// inline bootstrap/hydration scripts and no per-request nonce is plumbed
// through the app yet, so with 'unsafe-inline' present an injected inline
// <script> is NOT blocked and most of this policy's XSS value is lost.
// Tracked in context/progress-tracker.md ("CSP nonce"). Until it is
// closed, `report-uri` below routes every violation to /api/csp-report so
// the blind spot is at least observable. Everything except inline script
// is locked to 'self' + the allowlist above.
const cspReportUri = "/api/csp-report";
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
  `report-uri ${cspReportUri}`,
].join("; ");

export const securityHeaders = [
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
