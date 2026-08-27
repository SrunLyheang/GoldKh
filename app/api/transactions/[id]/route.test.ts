import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  deleteOwnedTransactionMock,
  updateOwnedTransactionMock,
  isRateLimitedMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteOwnedTransactionMock: vi.fn(),
  updateOwnedTransactionMock: vi.fn(),
  isRateLimitedMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/queries/transactions", () => ({
  deleteOwnedTransaction: deleteOwnedTransactionMock,
  updateOwnedTransaction: updateOwnedTransactionMock,
}));

vi.mock("@/lib/api/rateLimit", () => ({
  isRateLimited: isRateLimitedMock,
}));

import { DELETE, PATCH } from "./route";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

const validPayload = {
  type: "buy",
  quantity: "10",
  unit: "chi",
  pricePerUnit: "300.5",
  currency: "USD",
  transactionDate: "2026-01-15",
};

function patchRequest(body: unknown) {
  return new Request("http://localhost/api/transactions/tx_1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("PATCH /api/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRateLimitedMock.mockResolvedValue(false);
  });

  it("returns 429 when the session has exceeded the rate limit", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    isRateLimitedMock.mockResolvedValue(true);

    const res = await PATCH(patchRequest(validPayload), ctx("tx_1"));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(updateOwnedTransactionMock).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no session, before touching the DB", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await PATCH(patchRequest(validPayload), ctx("tx_1"));

    expect(res.status).toBe(401);
    expect(updateOwnedTransactionMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid payload with 400 and does not call the DB", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });

    const res = await PATCH(
      patchRequest({ ...validPayload, unit: "ounce" }),
      ctx("tx_1")
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(updateOwnedTransactionMock).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON body with 400 and does not call the DB", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });

    const res = await PATCH(
      new Request("http://localhost/api/transactions/tx_1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }),
      ctx("tx_1")
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(updateOwnedTransactionMock).not.toHaveBeenCalled();
  });

  it("scopes the update to the session userId, never a client value", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    updateOwnedTransactionMock.mockResolvedValue({
      ok: true,
      value: { id: "tx_1" },
    });

    const res = await PATCH(patchRequest(validPayload), ctx("tx_1"));
    const body = await res.json();

    expect(updateOwnedTransactionMock).toHaveBeenCalledWith(
      "user_123",
      "tx_1",
      expect.objectContaining({ type: "buy", quantity: "10" })
    );
    expect(body).toEqual({ data: { id: "tx_1" } });
  });

  it("returns 404 when the row does not exist", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    updateOwnedTransactionMock.mockResolvedValue({
      ok: false,
      reason: "not_found",
    });

    const res = await PATCH(patchRequest(validPayload), ctx("missing"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when the row belongs to another user", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    updateOwnedTransactionMock.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });

    const res = await PATCH(patchRequest(validPayload), ctx("not-mine"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});

describe("DELETE /api/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRateLimitedMock.mockResolvedValue(false);
  });

  it("returns 429 when the session has exceeded the rate limit", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    isRateLimitedMock.mockResolvedValue(true);

    const res = await DELETE(new Request("http://localhost"), ctx("tx_1"));
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(deleteOwnedTransactionMock).not.toHaveBeenCalled();
  });

  it("returns 401 when there is no session, before touching the DB", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await DELETE(new Request("http://localhost"), ctx("tx_1"));

    expect(res.status).toBe(401);
    expect(deleteOwnedTransactionMock).not.toHaveBeenCalled();
  });

  it("scopes the delete to the session userId, never a client value", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    deleteOwnedTransactionMock.mockResolvedValue({
      ok: true,
      value: { id: "tx_1" },
    });

    const res = await DELETE(new Request("http://localhost"), ctx("tx_1"));
    const body = await res.json();

    expect(deleteOwnedTransactionMock).toHaveBeenCalledWith("user_123", "tx_1");
    expect(body).toEqual({ data: { id: "tx_1" } });
  });

  it("returns 404 when the row does not exist", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    deleteOwnedTransactionMock.mockResolvedValue({
      ok: false,
      reason: "not_found",
    });

    const res = await DELETE(new Request("http://localhost"), ctx("missing"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when the row belongs to another user", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    deleteOwnedTransactionMock.mockResolvedValue({
      ok: false,
      reason: "forbidden",
    });

    const res = await DELETE(new Request("http://localhost"), ctx("not-mine"));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });
});
