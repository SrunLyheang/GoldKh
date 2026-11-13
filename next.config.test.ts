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

  it("allowlists no third-party script, frame, or image origins", () => {
    const value = csp();
    expect(value).not.toMatch(/clerk/i);
    expect(value).toContain("frame-src 'self'");
    expect(value).toContain("img-src 'self' data: blob:");
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
