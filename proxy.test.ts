import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({ validateEnv: vi.fn() }));

import { proxy } from "./proxy";
import { DEVICE_COOKIE, isValidDeviceId } from "@/lib/identity/device";

const EXISTING = "dev_AAAAAAAAAAAAAAAAAAAAAA";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: cookie ? { cookie } : {},
  });
}

// The request-side cookie Next forwards to server components.
function forwardedCookie(res: Response): string | null {
  return res.headers.get("x-middleware-request-cookie");
}

describe("proxy — anonymous device id", () => {
  it("mints a device id on first visit to the dashboard", () => {
    const res = proxy(request("/dashboard"));
    const id = res.cookies.get(DEVICE_COOKIE)?.value;
    expect(isValidDeviceId(id)).toBe(true);
    expect(res.cookies.get(DEVICE_COOKIE)?.httpOnly).toBe(true);
    // Forwarded on the request so this same render already sees it.
    expect(forwardedCookie(res)).toContain(`${DEVICE_COOKIE}=${id}`);
  });

  it("keeps an existing valid id and refreshes its lifetime", () => {
    const res = proxy(request("/api/transactions", `${DEVICE_COOKIE}=${EXISTING}`));
    expect(res.cookies.get(DEVICE_COOKIE)?.value).toBe(EXISTING);
    expect(res.cookies.get(DEVICE_COOKIE)?.maxAge).toBeGreaterThan(0);
  });

  it("replaces a malformed id instead of trusting it", () => {
    const res = proxy(request("/dashboard", `${DEVICE_COOKIE}=user_123`));
    const id = res.cookies.get(DEVICE_COOKIE)?.value;
    expect(id).not.toBe("user_123");
    expect(isValidDeviceId(id)).toBe(true);
  });

  it("leaves the landing page cookie-free", () => {
    const res = proxy(request("/"));
    expect(res.cookies.get(DEVICE_COOKIE)).toBeUndefined();
  });
});
