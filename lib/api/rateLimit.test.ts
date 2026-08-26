import { beforeEach, describe, expect, it, vi } from "vitest";

const { incrementRequestCountMock } = vi.hoisted(() => ({
  incrementRequestCountMock: vi.fn(),
}));

vi.mock("@/lib/db/queries/rateLimit", () => ({
  incrementRequestCount: incrementRequestCountMock,
}));

vi.mock("@/lib/constants/rateLimit", () => ({
  RATE_LIMIT_MAX_REQUESTS: 20,
}));

import { isRateLimited } from "./rateLimit";

describe("isRateLimited", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns false while at or under the limit", async () => {
    incrementRequestCountMock.mockResolvedValue(20);

    await expect(isRateLimited("user_123")).resolves.toBe(false);
  });

  it("returns true once the limit is exceeded", async () => {
    incrementRequestCountMock.mockResolvedValue(21);

    await expect(isRateLimited("user_123")).resolves.toBe(true);
  });

  it("always increments, even when already over the limit", async () => {
    incrementRequestCountMock.mockResolvedValue(30);

    await isRateLimited("user_123");

    expect(incrementRequestCountMock).toHaveBeenCalledWith("user_123");
  });
});
