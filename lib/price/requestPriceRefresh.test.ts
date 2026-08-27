import { afterEach, describe, expect, it, vi } from "vitest";
import { requestPriceRefresh } from "./requestPriceRefresh";

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, init: ResponseInit) {
  return new Response(JSON.stringify(body), init);
}

describe("requestPriceRefresh", () => {
  it("returns refreshed with the payload's cooldownEndsAt on a 200", async () => {
    const endsAt = Date.now() + 5 * 60_000;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { data: { id: "snap_1", cooldownEndsAt: endsAt } },
          { status: 200 }
        )
      )
    );

    await expect(requestPriceRefresh()).resolves.toEqual({
      kind: "refreshed",
      cooldownEndsAt: endsAt,
    });
    expect(fetch).toHaveBeenCalledWith("/api/price/refresh", { method: "POST" });
  });

  it("carries a null cooldownEndsAt straight through from a 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { data: { id: "snap_1", cooldownEndsAt: null } },
          { status: 200 }
        )
      )
    );

    await expect(requestPriceRefresh()).resolves.toEqual({
      kind: "refreshed",
      cooldownEndsAt: null,
    });
  });

  it("turns a 429 Retry-After header into an absolute cooldown deadline", async () => {
    const before = Date.now();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: { code: "COOLDOWN", message: "Too soon" } },
          { status: 429, headers: { "Retry-After": "180" } }
        )
      )
    );

    const outcome = await requestPriceRefresh();
    expect(outcome.kind).toBe("cooldown");
    if (outcome.kind !== "cooldown") return;
    expect(outcome.message).toBe("Too soon");
    expect(outcome.cooldownEndsAt).not.toBeNull();
    expect(outcome.cooldownEndsAt!).toBeGreaterThanOrEqual(before + 180_000);
    expect(outcome.cooldownEndsAt!).toBeLessThanOrEqual(Date.now() + 180_000);
  });

  it("returns a cooldown with a null deadline when the 429 has no usable Retry-After", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { message: "Too soon" } }, { status: 429 })
      )
    );

    await expect(requestPriceRefresh()).resolves.toEqual({
      kind: "cooldown",
      cooldownEndsAt: null,
      message: "Too soon",
    });
  });

  it("returns unreachable when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(requestPriceRefresh()).resolves.toEqual({ kind: "unreachable" });
  });

  it("returns failed with the envelope message on a non-429 error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({ error: { message: "Provider down" } }, { status: 502 })
      )
    );

    await expect(requestPriceRefresh()).resolves.toEqual({
      kind: "failed",
      message: "Provider down",
    });
  });

  it("returns failed with a null message when the error body can't be parsed", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>502</html>", { status: 502 }))
    );

    await expect(requestPriceRefresh()).resolves.toEqual({
      kind: "failed",
      message: null,
    });
  });
});
