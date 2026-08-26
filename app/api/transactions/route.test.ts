import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, createTransactionMock, listTransactionsMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    createTransactionMock: vi.fn(),
    listTransactionsMock: vi.fn(),
  })
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: authMock,
}));

vi.mock("@/lib/db/queries/transactions", () => ({
  createTransactionForUser: createTransactionMock,
  listTransactionsForUser: listTransactionsMock,
}));

import { GET, POST } from "./route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validPayload = {
  type: "buy",
  quantity: "10",
  unit: "chi",
  pricePerUnit: "300.5",
  currency: "USD",
  transactionDate: "2026-01-15",
};

describe("GET /api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
    expect(listTransactionsMock).not.toHaveBeenCalled();
  });

  it("scopes the query to the session's userId, never a client value", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    listTransactionsMock.mockResolvedValue([{ id: "tx_1" }]);

    const res = await GET();
    const body = await res.json();

    expect(listTransactionsMock).toHaveBeenCalledWith("user_123");
    expect(body).toEqual({ data: [{ id: "tx_1" }] });
  });
});

describe("POST /api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no session, before touching the body", async () => {
    authMock.mockResolvedValue({ userId: null });

    const res = await POST(jsonRequest(validPayload));

    expect(res.status).toBe(401);
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid payload with 400 and does not call the DB", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });

    const res = await POST(jsonRequest({ ...validPayload, unit: "ounce" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it("creates a transaction scoped to the session userId, ignoring any userId in the body", async () => {
    authMock.mockResolvedValue({ userId: "user_123" });
    createTransactionMock.mockResolvedValue({ id: "tx_new" });

    const res = await POST(
      jsonRequest({ ...validPayload, userId: "someone_else" })
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(createTransactionMock).toHaveBeenCalledWith(
      "user_123",
      expect.objectContaining({ type: "buy", quantity: "10" })
    );
    expect(body).toEqual({ data: { id: "tx_new" } });
  });
});
