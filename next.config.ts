import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP origin groups. Everything is 'self' except Sentry: the single
// ingest host from the DSN, exact origin, no wildcard. There is no
// third-party auth provider — identity is a first-party device cookie
// (lib/identity/device.ts).

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

// `next dev` uses eval() (Turbopack HMR, dev stack traces), which CSP blocks
// without 'unsafe-eval'. Dev-only so production stays eval-free.
const devScriptSrc =
  process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

// KNOWN GAP — script-src still allows 'unsafe-inline' (Next.js inline
// bootstrap scripts, no nonce plumbed yet), so injected inline <script> is
// not blocked. Tracked as "CSP nonce". Until then `report-uri` routes every
// violation to /api/csp-report. Everything else is 'self' + the allowlist.
const cspReportUri = "/api/csp-report";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  `script-src 'self' 'unsafe-inline'${devScriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${sentryOrigins}`.trim(),
  "frame-src 'self'",
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
  // Pin the Turbopack workspace root; otherwise it walks up to a stray
  // package-lock.json in the home directory and warns.
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

// No org/project/authToken yet — source-map upload is skipped; `silent`
// suppresses Sentry's build-time console noise until it's configured.
export default withSentryConfig(nextConfig, {
  silent: true,
});
