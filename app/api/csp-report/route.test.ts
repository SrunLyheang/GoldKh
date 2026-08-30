import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureMessageMock } = vi.hoisted(() => ({
  captureMessageMock: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureMessage: captureMessageMock,
}));

import { POST } from "./route";

function report(body: string, init?: RequestInit) {
  return POST(
    new Request("http://localhost/api/csp-report", {
      method: "POST",
      body,
      ...init,
    }),
  );
}

describe("POST /api/csp-report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards a legacy application/csp-report body to Sentry", async () => {
    const res = await report(
      JSON.stringify({
        "csp-report": {
          "violated-directive": "script-src",
          "blocked-uri": "https://evil.example/x.js",
        },
      }),
    );

    expect(res.status).toBe(204);
    expect(captureMessageMock).toHaveBeenCalledTimes(1);
    expect(captureMessageMock).toHaveBeenCalledWith(
      "CSP violation",
      expect.objectContaining({
        level: "warning",
        extra: {
          violation: expect.objectContaining({
            "violated-directive": "script-src",
          }),
        },
      }),
    );
  });

  it("forwards each entry of a Reporting API batch", async () => {
    const res = await report(
      JSON.stringify([
        { type: "csp-violation", body: { "blocked-uri": "inline" } },
        { type: "csp-violation", body: { "blocked-uri": "eval" } },
        { type: "deprecation", body: { id: "ignored" } },
      ]),
    );

    expect(res.status).toBe(204);
    expect(captureMessageMock).toHaveBeenCalledTimes(2);
  });

  it("ignores numeric entry types without crashing", async () => {
    const res = await report(
      JSON.stringify([
        { type: 123, body: { "blocked-uri": "inline" } },
        { type: null, body: { "blocked-uri": "eval" } },
      ]),
    );

    expect(res.status).toBe(204);
    expect(captureMessageMock).toHaveBeenCalledTimes(1);
    expect(captureMessageMock).toHaveBeenCalledWith(
      "CSP violation",
      expect.objectContaining({
        extra: {
          violation: expect.objectContaining({ "blocked-uri": "eval" }),
        },
      }),
    );
  });

  it("returns 400 on a non-JSON body without calling Sentry", async () => {
    const res = await report("not json");

    expect(res.status).toBe(400);
    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it("returns 413 on an oversized body", async () => {
    const res = await report(JSON.stringify({ pad: "x".repeat(20 * 1024) }));

    expect(res.status).toBe(413);
    expect(captureMessageMock).not.toHaveBeenCalled();
  });
});
