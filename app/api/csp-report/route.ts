import * as Sentry from "@sentry/nextjs";

// Sink for `report-uri` violations from the Content-Security-Policy set in
// next.config.ts. Browsers POST here unauthenticated (no session cookie,
// no CSRF token — that is how the reporting API works), so this route
// takes no `withAuth` wrapper. It only records; it never trusts the
// payload beyond logging it.
//
// Two wire formats land here:
//   - legacy `application/csp-report`: `{ "csp-report": { ... } }`
//   - Reporting API `application/reports+json`: `[{ "type": "csp-violation",
//     "body": { ... } }, ...]`
// Both are normalised to a list of violation objects and forwarded to
// Sentry as a warning (a no-op when no DSN is configured).

const MAX_BODY_BYTES = 16 * 1024;
const MAX_CSP_REPORTS_PER_REQUEST = 50;
const CSP_REPORT_WINDOW_MS = 60_000;
const CSP_REPORTS_PER_IP = 20;
const recentCspEvents = new Map<string, number[]>();

export async function POST(request: Request): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }

  const violations = normalizeReports(parsed);
  if (violations.length > 0 && isRateLimitedForCspReport(request)) {
    return new Response(null, { status: 429 });
  }

  for (const violation of violations) {
    Sentry.captureMessage("CSP violation", {
      level: "warning",
      extra: { violation },
    });
  }

  // 204: browsers ignore the response body for report endpoints.
  return new Response(null, { status: 204 });
}

function normalizeReports(payload: unknown): unknown[] {
  const reports = Array.isArray(payload)
    ? payload
        .filter(
          (entry): entry is { type?: string; body?: unknown } =>
            typeof entry === "object" && entry !== null,
        )
        .filter(
          (entry) =>
            entry.type == null ||
            (typeof entry.type === "string" && entry.type.includes("csp")),
        )
        .map((entry) => entry.body ?? entry)
    : payload && typeof payload === "object" && "csp-report" in payload
      ? [(payload as Record<string, unknown>)["csp-report"]]
      : payload == null
        ? []
        : [payload];

  return reports.slice(0, MAX_CSP_REPORTS_PER_REQUEST);
}

function isRateLimitedForCspReport(request: Request): boolean {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cloudflareIp = request.headers.get("cf-connecting-ip");
  const key = forwarded?.split(",", 1)[0]?.trim() || realIp || cloudflareIp;

  if (!key) {
    return false;
  }

  const now = Date.now();
  const timestamps = recentCspEvents.get(key) ?? [];
  const recent = timestamps.filter(
    (timestamp) => now - timestamp < CSP_REPORT_WINDOW_MS,
  );

  if (recent.length >= CSP_REPORTS_PER_IP) {
    return true;
  }

  recent.push(now);
  recentCspEvents.set(key, recent);
  return false;
}
