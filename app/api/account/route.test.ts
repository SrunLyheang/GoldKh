import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, deleteUserMock, isRateLimitedMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteUserMock: vi.fn(),
  isRateLimitedMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
  clerkClient: vi.fn(async () => ({ users: { deleteUser: deleteUserMock } })),
}));
vi.mock("@/lib/api/rateLimit", () => ({ isRateLimited: isRateLimitedMock }));

import { DELETE } from "./route";

function req(headers?: Record<string, string>) {
  return new Request("http://localhost/api/account", {
    method: "DELETE",
    headers,
  });
}

describe("DELETE /api/account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRateLimitedMock.mockResolvedValue(false);
    authMock.mockResolvedValue({ userId: "user_123" });
  });

  it("returns 401 and never calls Clerk without a session", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await DELETE(req());
    expect(res.status).toBe(401);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate-limited", async () => {
    isRateLimitedMock.mockResolvedValue(true);
    const res = await DELETE(req());
    expect(res.status).toBe(429);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request with 403", async () => {
    const res = await DELETE(req({ origin: "https://evil.example" }));
    expect(res.status).toBe(403);
    expect(deleteUserMock).not.toHaveBeenCalled();
  });

  it("deletes the session user via Clerk, never a client-supplied id", async () => {
    deleteUserMock.mockResolvedValue({});
    const res = await DELETE(req());
    const body = await res.json();
    expect(deleteUserMock).toHaveBeenCalledWith("user_123");
    expect(body).toEqual({ data: { deleted: true } });
  });

  it("maps a Clerk failure to a 502 envelope", async () => {
    deleteUserMock.mockRejectedValue(new Error("clerk down"));
    const res = await DELETE(req());
    const body = await res.json();
    expect(res.status).toBe(502);
    expect(body.error.code).toBe("ACCOUNT_DELETE_FAILED");
  });
});
