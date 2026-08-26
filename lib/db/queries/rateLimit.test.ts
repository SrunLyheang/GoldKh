import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { returningMock, valuesMock, insertMock } = vi.hoisted(() => {
  const returningMock = vi.fn();
  const onConflictDoUpdateMock = vi.fn(() => ({ returning: returningMock }));
  const valuesMock = vi.fn(() => ({
    onConflictDoUpdate: onConflictDoUpdateMock,
  }));
  const insertMock = vi.fn(() => ({ values: valuesMock }));
  return { returningMock, valuesMock, insertMock };
});

vi.mock("@/lib/db/client", () => ({
  db: { insert: insertMock },
}));

vi.mock("@/lib/constants/rateLimit", () => ({
  RATE_LIMIT_WINDOW_MS: 5 * 60 * 1000,
}));

import { incrementRequestCount } from "./rateLimit";

describe("incrementRequestCount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    returningMock.mockResolvedValue([{ count: 3 }]);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("floors the window to the configured boundary and inserts it", async () => {
    // 2026-01-01T00:07:30Z floors to 00:05:00Z on a 5-minute window.
    vi.setSystemTime(new Date("2026-01-01T00:07:30.000Z"));

    await incrementRequestCount("user_123");

    expect(valuesMock).toHaveBeenCalledWith({
      userId: "user_123",
      windowStart: new Date("2026-01-01T00:05:00.000Z"),
      count: 1,
    });
  });

  it("returns the count from the upsert result", async () => {
    returningMock.mockResolvedValue([{ count: 7 }]);

    await expect(incrementRequestCount("user_123")).resolves.toBe(7);
  });
});
