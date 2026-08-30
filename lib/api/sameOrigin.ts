import { apiError } from "./response";

// Lightweight CSRF guard for state-changing routes. Clerk authenticates
// with a cookie, so a cross-site page could otherwise drive an authed
// request from a victim's browser. A browser always attaches `Origin` on a
// cross-origin POST and cannot forge it, so a mismatch is a reliable
// reject. A missing `Origin` (server-to-server callers, curl) is allowed
// through — the attack this closes is specifically the browser one.
export function assertSameOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (origin === null) return null;

  let expected: string;
  try {
    expected = new URL(request.url).origin;
  } catch {
    return null;
  }

  if (origin !== expected) {
    return apiError("CROSS_ORIGIN", "Cross-origin request rejected", 403);
  }
  return null;
}
