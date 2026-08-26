import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, deleteOwnedTransactionMock, updateOwnedTransactionMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    deleteOwnedTransactionMock: vi.fn(),
    updateOwnedTransactionMock: vi.fn(),
  }));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/queries/transactions", () => ({
  deleteOwnedTransaction: deleteOwnedTransactionMock,
  updateOwnedTransaction: updateOwnedTransactionMock,
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

  it("scopes the update to the session userId, never a client value", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    updateOwnedTransactionMock.mockResolvedValue({ id: "tx_1" });

    const res = await PATCH(patchRequest(validPayload), ctx("tx_1"));
    const body = await res.json();

    expect(updateOwnedTransactionMock).toHaveBeenCalledWith(
      "user_123",
      "tx_1",
      expect.objectContaining({ type: "buy", quantity: "10" })
    );
    expect(body).toEqual({ data: { id: "tx_1" } });
  });

  it("returns 404 when the row doesn't exist or isn't owned by this user", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    updateOwnedTransactionMock.mockResolvedValue(undefined);

    const res = await PATCH(patchRequest(validPayload), ctx("not-mine"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("DELETE /api/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session, before touching the DB", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await DELETE(new Request("http://localhost"), ctx("tx_1"));

    expect(res.status).toBe(401);
    expect(deleteOwnedTransactionMock).not.toHaveBeenCalled();
  });

  it("scopes the delete to the session userId, never a client value", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    deleteOwnedTransactionMock.mockResolvedValue({ id: "tx_1" });

    const res = await DELETE(new Request("http://localhost"), ctx("tx_1"));
    const body = await res.json();

    expect(deleteOwnedTransactionMock).toHaveBeenCalledWith("user_123", "tx_1");
    expect(body).toEqual({ data: { id: "tx_1" } });
  });

  it("returns 404 when the row doesn't exist or isn't owned by this user", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    deleteOwnedTransactionMock.mockResolvedValue(undefined);

    const res = await DELETE(new Request("http://localhost"), ctx("not-mine"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});
