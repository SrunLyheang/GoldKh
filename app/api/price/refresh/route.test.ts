import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getLatestSnapshotMock,
  insertSnapshotMock,
  fetchGoldapiPriceMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getLatestSnapshotMock: vi.fn(),
  insertSnapshotMock: vi.fn(),
  fetchGoldapiPriceMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/queries/priceSnapshots", () => ({
  getLatestSnapshot: getLatestSnapshotMock,
  insertSnapshot: insertSnapshotMock,
}));

vi.mock("@/lib/price/providers/goldapi", () => ({
  fetchGoldapiPrice: fetchGoldapiPriceMock,
}));

// priceFreshness is a pure function of the snapshot's capturedAt — not
// mocked. Tests drive the cooldown branch by choosing capturedAt.
import { POST } from "./route";

describe("POST /api/price/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await POST();

    expect(res.status).toBe(401);
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("returns 429 with a Retry-After header when the newest snapshot is still within the cooldown", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    getLatestSnapshotMock.mockResolvedValue({ capturedAt: new Date() });

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("COOLDOWN");
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("fetches, inserts a manual snapshot, and returns it with cooldownEndsAt when the cooldown has passed", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
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

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(insertSnapshotMock).toHaveBeenCalledWith(
      { pricePerTroyOz: "2500.0000", source: "goldapi.io" },
      { manual: true }
    );
    expect(body.data.id).toBe("snap_1");
    expect(typeof body.data.cooldownEndsAt).toBe("number");
  });

  it("returns 502 when the provider throws", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    getLatestSnapshotMock.mockResolvedValue(undefined);
    fetchGoldapiPriceMock.mockRejectedValue(new Error("network error"));

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error.code).toBe("PROVIDER_ERROR");
    expect(insertSnapshotMock).not.toHaveBeenCalled();
  });
});
