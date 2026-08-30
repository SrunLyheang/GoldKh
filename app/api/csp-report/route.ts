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

  for (const violation of normalizeReports(parsed)) {
    Sentry.captureMessage("CSP violation", {
      level: "warning",
      extra: { violation },
    });
  }

  // 204: browsers ignore the response body for report endpoints.
  return new Response(null, { status: 204 });
}

function normalizeReports(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    // Reporting API batch — keep only CSP entries' bodies.
    return payload
      .filter(
        (entry): entry is { type?: string; body?: unknown } =>
          typeof entry === "object" && entry !== null
      )
      .filter((entry) => entry.type == null || entry.type.includes("csp"))
      .map((entry) => entry.body ?? entry);
  }
  if (payload && typeof payload === "object" && "csp-report" in payload) {
    return [(payload as Record<string, unknown>)["csp-report"]];
  }
  return payload == null ? [] : [payload];
}
