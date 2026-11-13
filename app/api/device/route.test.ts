import { beforeEach, describe, expect, it, vi } from "vitest";

const { deviceIdMock, deleteAllMock, isRateLimitedMock } = vi.hoisted(() => ({
  deviceIdMock: vi.fn(),
  deleteAllMock: vi.fn(),
  isRateLimitedMock: vi.fn(),
}));

vi.mock("@/lib/identity/server", () => ({ getDeviceId: deviceIdMock }));
vi.mock("@/lib/db/queries/transactions", () => ({
  deleteAllTransactionsForUser: deleteAllMock,
}));
vi.mock("@/lib/api/rateLimit", () => ({ isRateLimited: isRateLimitedMock }));

import { DELETE, POST } from "./route";
import { DEVICE_COOKIE, isValidDeviceId } from "@/lib/identity/device";

const CURRENT = "dev_CURRENTCURRENTCURRENTx";
const OTHER = "dev_OTHEROTHEROTHEROTHEROx";

function req(
  method: "POST" | "DELETE",
  body?: unknown,
  headers?: Record<string, string>
) {
  return new Request("http://localhost/api/device", {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function setCookie(res: Response): string | undefined {
  const header = res.headers.get("set-cookie") ?? "";
  const match = header.match(new RegExp(`${DEVICE_COOKIE}=([^;]+)`));
  return match?.[1];
}

beforeEach(() => {
  vi.clearAllMocks();
  isRateLimitedMock.mockResolvedValue(false);
  deviceIdMock.mockResolvedValue(CURRENT);
});

describe("POST /api/device (restore from recovery code)", () => {
  it("switches the device cookie to the pasted code", async () => {
    const res = await POST(req("POST", { code: `  ${OTHER}  ` }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { switched: true } });
    expect(setCookie(res)).toBe(OTHER);
  });

  it("rejects something that isn't a recovery code", async () => {
    const res = await POST(req("POST", { code: "user_123" }));
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("INVALID_RECOVERY_CODE");
    expect(setCookie(res)).toBeUndefined();
  });

  it("rejects a cross-origin request", async () => {
    const res = await POST(
      req("POST", { code: OTHER }, { origin: "https://evil.example" })
    );
    expect(res.status).toBe(403);
    expect(setCookie(res)).toBeUndefined();
  });

  it("returns 401 with no device id", async () => {
    deviceIdMock.mockResolvedValue(null);
    const res = await POST(req("POST", { code: OTHER }));
    expect(res.status).toBe(401);
  });

  it("returns 429 when rate-limited", async () => {
    isRateLimitedMock.mockResolvedValue(true);
    const res = await POST(req("POST", { code: OTHER }));
    expect(res.status).toBe(429);
  });
});

describe("DELETE /api/device (start fresh)", () => {
  it("erases only this device's rows and issues a new id", async () => {
    deleteAllMock.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    const res = await DELETE(req("DELETE"));
    expect(deleteAllMock).toHaveBeenCalledWith(CURRENT);
    expect(await res.json()).toEqual({ data: { erased: 2 } });
    const next = setCookie(res);
    expect(isValidDeviceId(next)).toBe(true);
    expect(next).not.toBe(CURRENT);
  });

  it("rejects a cross-origin request without deleting", async () => {
    const res = await DELETE(
      req("DELETE", undefined, { origin: "https://evil.example" })
    );
    expect(res.status).toBe(403);
    expect(deleteAllMock).not.toHaveBeenCalled();
  });
});
