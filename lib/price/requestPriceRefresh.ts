// Owns the entire client-side conversation with POST /api/price/refresh:
// the endpoint path, that a 429 carries the cooldown deadline as a
// Retry-After header (seconds remaining, not the JSON envelope — see
// code-standards.md), that a 200 carries it as cooldownEndsAt in the data
// payload, and how a dropped connection differs from a route-level error.
// Returns one of four outcomes — see CONTEXT.md "manual refresh outcome".
//
// No React in here on purpose: the caller switches on `kind` and owns
// every piece of UI state, every timer, and all i18n copy. This module is
// the wire contract and nothing else, so it can be tested without a DOM.

export type RefreshOutcome =
  | { kind: "refreshed"; cooldownEndsAt: number | null }
  | { kind: "cooldown"; cooldownEndsAt: number | null; message: string | null }
  | { kind: "unreachable" }
  | { kind: "failed"; message: string | null };

export async function requestPriceRefresh(): Promise<RefreshOutcome> {
  let res: Response;
  try {
    res = await fetch("/api/price/refresh", { method: "POST" });
  } catch {
    return { kind: "unreachable" };
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message: string | null = body?.error?.message ?? null;

    if (res.status === 429) {
      // Retry-After is a remaining-duration in seconds; anchor it to now,
      // which is when we received it. Missing or unparseable → null, and
      // the caller simply won't arm a cooldown window.
      const retryAfter = Number(res.headers.get("Retry-After"));
      const cooldownEndsAt =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Date.now() + retryAfter * 1000
          : null;
      return { kind: "cooldown", cooldownEndsAt, message };
    }

    return { kind: "failed", message };
  }

  const body = await res.json();
  // The server computed the deadline from the snapshot it just captured
  // and handed it back — no client-side recompute from a constant.
  const cooldownEndsAt: number | null = body.data.cooldownEndsAt ?? null;
  return { kind: "refreshed", cooldownEndsAt };
}
