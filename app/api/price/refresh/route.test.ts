import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  getLatestManualSnapshotMock,
  insertSnapshotMock,
  isManualCooldownActiveMock,
  fetchGoldapiPriceMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getLatestManualSnapshotMock: vi.fn(),
  insertSnapshotMock: vi.fn(),
  isManualCooldownActiveMock: vi.fn(),
  fetchGoldapiPriceMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/price/getPrice", () => ({
  getLatestManualSnapshot: getLatestManualSnapshotMock,
  insertSnapshot: insertSnapshotMock,
  isManualCooldownActive: isManualCooldownActiveMock,
}));

vi.mock("@/lib/price/providers/goldapi", () => ({
  fetchGoldapiPrice: fetchGoldapiPriceMock,
}));

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

  it("returns 429 when a manual refresh is still within its cooldown", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    const latestManual = { capturedAt: new Date() };
    getLatestManualSnapshotMock.mockResolvedValue(latestManual);
    isManualCooldownActiveMock.mockReturnValue(true);

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("COOLDOWN");
    expect(fetchGoldapiPriceMock).not.toHaveBeenCalled();
  });

  it("fetches, inserts a manual snapshot, and returns it when the cooldown has passed", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    getLatestManualSnapshotMock.mockResolvedValue(undefined);
    isManualCooldownActiveMock.mockReturnValue(false);
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
  });

  it("returns 502 when the provider throws", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    getLatestManualSnapshotMock.mockResolvedValue(undefined);
    isManualCooldownActiveMock.mockReturnValue(false);
    fetchGoldapiPriceMock.mockRejectedValue(new Error("network error"));

    const res = await POST();
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error.code).toBe("PROVIDER_ERROR");
    expect(insertSnapshotMock).not.toHaveBeenCalled();
  });
});
