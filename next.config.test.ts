import { afterEach, describe, expect, it, vi } from "vitest";
import nextConfig, { securityHeaders } from "./next.config";

// Proves the security headers actually ship in the config Next.js reads —
// not just that a CSP string exists somewhere. If `headers()` or the CSP
// directives regress, this fails.
describe("next.config security headers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  function csp(): string {
    const header = securityHeaders.find(
      (h) => h.key === "Content-Security-Policy"
    );
    if (!header) throw new Error("no Content-Security-Policy header");
    return header.value;
  }

  it("emits a Content-Security-Policy header", () => {
    expect(csp().length).toBeGreaterThan(0);
  });

  it("locks down the dangerous fetch directives", () => {
    const value = csp();
    expect(value).toContain("default-src 'self'");
    expect(value).toContain("object-src 'none'");
    expect(value).toContain("base-uri 'self'");
    expect(value).toContain("frame-ancestors 'self'");
    expect(value).toContain("form-action 'self'");
  });

  it("routes violations to the report endpoint (nonce gap still open)", () => {
    expect(csp()).toContain("report-uri /api/csp-report");
  });

  // Regression: a production instance loads clerk-js from its custom
  // domain (clerk.<prod-domain>), encoded in the pk_live_ key. That host
  // must reach script-src / connect-src / frame-src or Clerk fails to
  // load and hydration throws React #418.
  it("allowlists the Clerk Frontend API host from the publishable key", async () => {
    // base64("clerk.goldkh.xyz$") — the shape of a live custom-domain key.
    const host = "clerk.goldkh.xyz";
    const encoded = Buffer.from(`${host}$`).toString("base64");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", `pk_live_${encoded}`);
    vi.resetModules();
    const { securityHeaders: headers } = await import("./next.config");
    const value = headers.find(
      (h) => h.key === "Content-Security-Policy"
    )!.value;
    for (const directive of ["script-src", "connect-src", "frame-src"]) {
      const line = value
        .split("; ")
        .find((d) => d.startsWith(`${directive} `));
      expect(line).toContain(`https://${host}`);
    }
  });

  it("ships the other baseline security headers", () => {
    const keys = securityHeaders.map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "X-Content-Type-Options",
        "Referrer-Policy",
        "Strict-Transport-Security",
        "Permissions-Policy",
      ])
    );
  });

  it("applies the headers to every path", async () => {
    const headers = nextConfig.headers ? await nextConfig.headers() : [];
    const rule = headers.find((r) => r.source === "/:path*");
    expect(rule?.headers).toBe(securityHeaders);
  });
});
