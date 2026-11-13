import { beforeEach, describe, expect, it, vi } from "vitest";

const { deviceIdMock, isRateLimitedMock } = vi.hoisted(() => ({
  deviceIdMock: vi.fn(),
  isRateLimitedMock: vi.fn(),
}));

vi.mock("@/lib/identity/server", () => ({
  getDeviceId: deviceIdMock,
}));

vi.mock("./rateLimit", () => ({
  isRateLimited: isRateLimitedMock,
}));

import { withAuthAndRateLimit } from "./withAuthAndRateLimit";

function req() {
  return new Request("http://localhost/api/whatever");
}

describe("withAuthAndRateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 and never calls the handler when there is no session", async () => {
    deviceIdMock.mockResolvedValue(null);
    const handler = vi.fn();
    const wrapped = withAuthAndRateLimit(handler);

    const res = await wrapped(req(), {});
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(isRateLimitedMock).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 429 and never calls the handler when rate-limited", async () => {
    deviceIdMock.mockResolvedValue("dev_123");
    isRateLimitedMock.mockResolvedValue(true);
    const handler = vi.fn();
    const wrapped = withAuthAndRateLimit(handler);

    const res = await wrapped(req(), {});
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(handler).not.toHaveBeenCalled();
  });

  it("checks rate limit only after auth succeeds", async () => {
    deviceIdMock.mockResolvedValue("dev_123");
    isRateLimitedMock.mockResolvedValue(false);
    const handler = vi.fn(async () => new Response(null, { status: 200 }));
    const wrapped = withAuthAndRateLimit(handler);

    await wrapped(req(), {});

    expect(isRateLimitedMock).toHaveBeenCalledWith("dev_123");
  });

  it("calls the handler with userId merged into the original context", async () => {
    deviceIdMock.mockResolvedValue("dev_123");
    isRateLimitedMock.mockResolvedValue(false);
    const handler = vi.fn(async () => new Response(null, { status: 200 }));
    const wrapped = withAuthAndRateLimit<{ params: Promise<{ id: string }> }>(
      handler
    );
    const params = Promise.resolve({ id: "tx_1" });

    await wrapped(req(), { params });

    expect(handler).toHaveBeenCalledWith(
      expect.any(Request),
      { params, userId: "dev_123" }
    );
  });
});
