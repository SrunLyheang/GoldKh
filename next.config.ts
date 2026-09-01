import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// CSP origin groups. Clerk: *.clerk.accounts.dev + *.clerk.com, plus the
// custom-domain Frontend API host decoded from the publishable key.
// Turnstile: challenges.cloudflare.com (Clerk bot protection iframe).
// Sentry: the single ingest host from the DSN, exact origin, no wildcard.
// Images: img.clerk.com only (Clerk avatars).

// The Frontend API host is base64url-encoded in the publishable key
// (`pk_(test|live)_<base64url("<host>$")>`). Decoding it here means a
// production custom domain needs no extra env var.
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
