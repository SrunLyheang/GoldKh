import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getLatestSnapshotMock,
  insertSnapshotMock,
  fetchGoldapiPriceMock,
  isMarketOpenMock,
  isRateLimitedMock,
  captureExceptionMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getLatestSnapshotMock: vi.fn(),
  insertSnapshotMock: vi.fn(),
  fetchGoldapiPriceMock: vi.fn(),
  isMarketOpenMock: vi.fn(),
  isRateLimitedMock: vi.fn(),
  captureExceptionMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: captureExceptionMock,
}));

vi.mock("@/lib/api/rateLimit", () => ({
  isRateLimited: isRateLimitedMock,
}));

vi.mock("@/lib/db/queries/priceSnapshots", () => ({
  getLatestSnapshot: getLatestSnapshotMock,
  insertSnapshot: insertSnapshotMock,
}));

vi.mock("@/lib/price/providers/goldapi", () => ({
  fetchGoldapiPrice: fetchGoldapiPriceMock,
}));

vi.mock("@/lib/price/marketHours", () => ({
  isMarketOpen: isMarketOpenMock,
}));

// priceFreshness is a pure function of the snapshot's capturedAt — not
// mocked. Tests drive the cooldown branch by choosing capturedAt.
import { POST } from "./route";

function post(init?: RequestInit) {
  return POST(
    new Request("http://localhost/api/price/refresh", {
      method: "POST",
      ...init,
    }),
  );
}

describe("POST /api/price/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMarketOpenMock.mockReturnValue(true);
    isRateLimitedMock.mockResolvedValue(false);
    authMock.mockResolvedValue({ userId: "user_123" });
  });

  it("returns 409 MARKET_CLOSED without calling the provider when the market is closed", async () => {
    isMarketOpenMock.mockReturnValue(false);

    const res = await post();
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("MARKET_CLOSED");
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await post();

    expect(res.status).toBe(401);
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("returns 429 RATE_LIMITED when the per-user window is exceeded", async () => {
    isRateLimitedMock.mockResolvedValue(true);

    const res = await post();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request with 403 before touching the provider", async () => {
    const res = await post({ headers: { origin: "https://evil.example" } });
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("CROSS_ORIGIN");
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("allows a same-origin request", async () => {
    getLatestSnapshotMock.mockResolvedValue(undefined);
    fetchGoldapiPriceMock.mockResolvedValue({
      pricePerTroyOz: "2500.0000",
      source: "goldapi.io",
    });
    insertSnapshotMock.mockResolvedValue({
      id: "snap_1",
      pricePerTroyOz: "2500.0000",
      source: "goldapi.io",
      capturedAt: new Date(),
    });

    const res = await post({ headers: { origin: "http://localhost" } });

    expect(res.status).toBe(200);
  });

  it("returns 429 with a Retry-After header when the newest snapshot is still within the cooldown", async () => {
    getLatestSnapshotMock.mockResolvedValue({ capturedAt: new Date() });

    const res = await post();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("COOLDOWN");
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("serializes overlapping refreshes across different users so only one provider request proceeds", async () => {
    getLatestSnapshotMock.mockResolvedValue(undefined);
    fetchGoldapiPriceMock.mockImplementation(
      async () =>
        await new Promise((resolve) =>
          setTimeout(() => {
            resolve({
              pricePerTroyOz: "2500.0000",
              source: "goldapi.io",
            });
          }, 25),
        ),
    );
    insertSnapshotMock.mockResolvedValue({
      id: "snap_1",
      pricePerTroyOz: "2500.0000",
      source: "goldapi.io",
      capturedAt: new Date(),
    });

    authMock.mockResolvedValueOnce({ userId: "user_001" });
    authMock.mockResolvedValueOnce({ userId: "user_002" });

    const [first, second] = await Promise.all([
      post({ headers: { origin: "http://localhost" } }),
      post({ headers: { origin: "http://localhost" } }),
    ]);

    expect(fetchGoldapiPriceMock).toHaveBeenCalledTimes(1);
    expect(insertSnapshotMock).toHaveBeenCalledTimes(1);
    expect([first.status, second.status]).toContain(200);
    expect([first.status, second.status]).toContain(429);
  });

  it("fetches, inserts a manual snapshot, and returns it with cooldownEndsAt when the cooldown has passed", async () => {
    getLatestSnapshotMock.mockResolvedValue(undefined);
    fetchGoldapiPriceMock.mockResolvedValue({
      pricePerTroyOz: "2500.0000",
      source: "goldapi.io",
    });
    insertSnapshotMock.mockResolvedValue({
      id: "snap_1",
      pricePerTroyOz: "2500.0000",
      source: "goldapi.io",
      capturedAt: new Date(),
    });

    const res = await post();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(insertSnapshotMock).toHaveBeenCalledWith(
      { pricePerTroyOz: "2500.0000", source: "goldapi.io" },
      { manual: true },
    );
    expect(body.data.id).toBe("snap_1");
    expect(typeof body.data.cooldownEndsAt).toBe("number");
  });

  it("returns 502 and reports to Sentry when the provider throws", async () => {
    getLatestSnapshotMock.mockResolvedValue(undefined);
    const err = new Error("network error");
    fetchGoldapiPriceMock.mockRejectedValue(err);

    const res = await post();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error.code).toBe("PROVIDER_ERROR");
    expect(insertSnapshotMock).not.toHaveBeenCalled();
    expect(captureExceptionMock).toHaveBeenCalledWith(err);
  });
});
