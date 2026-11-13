// Anonymous device identity — see CONTEXT.md invariant 6.
//
// There is no sign-up. The first time a browser reaches /dashboard or
// /api, proxy.ts mints a random device id and stores it in an httpOnly
// cookie; every transaction row is scoped to that id (`user_id` column).
// The id is a bearer secret: whoever holds it owns the ledger. It is
// shown to the user in Settings as a recovery code so they can carry the
// same ledger to another browser or device.
//
// Edge-safe (Web Crypto only, no next/headers) so proxy.ts can import it.

export const DEVICE_COOKIE = "goldkh_device";

// "dev_" + 16 random bytes as base64url = 22 chars, 128 bits of entropy —
// not enumerable, so possession of a valid-looking id is enough.
const DEVICE_ID_PATTERN = /^dev_[A-Za-z0-9_-]{22}$/;

// ~400 days: the longest cookie lifetime browsers honour. Refreshed on
// every request through proxy.ts, so an active device never expires.
export const DEVICE_COOKIE_MAX_AGE_S = 400 * 24 * 60 * 60;

export function isValidDeviceId(value: unknown): value is string {
  return typeof value === "string" && DEVICE_ID_PATTERN.test(value);
}

export function newDeviceId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const b64url = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `dev_${b64url}`;
}

export function deviceCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DEVICE_COOKIE_MAX_AGE_S,
  };
}

// Only these paths need an identity. The landing page stays cookie-free.
export function needsDeviceId(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/api/")
  );
}
