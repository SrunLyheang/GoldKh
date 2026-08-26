import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, deleteOwnedTransactionMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  deleteOwnedTransactionMock: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/queries/transactions", () => ({
  deleteOwnedTransaction: deleteOwnedTransactionMock,
}));

import { DELETE } from "./route";

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

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
