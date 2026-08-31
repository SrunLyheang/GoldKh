import { beforeEach, describe, expect, it, vi } from "vitest";

const { authMock, createManyMock, deleteManyMock, isRateLimitedMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    createManyMock: vi.fn(),
    deleteManyMock: vi.fn(),
    isRateLimitedMock: vi.fn(),
  }));

vi.mock("@clerk/nextjs/server", () => ({ auth: authMock }));
vi.mock("@/lib/db/queries/transactions", () => ({
  createManyTransactionsForUser: createManyMock,
  deleteManyOwnedTransactions: deleteManyMock,
}));
vi.mock("@/lib/api/rateLimit", () => ({ isRateLimited: isRateLimitedMock }));

import { MAX_BULK_ROWS } from "@/lib/constants/csv";
import { DELETE, POST } from "./route";

const ORIGIN = "http://localhost";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function deleteRequest(
  body: unknown,
  headers: Record<string, string> = { Origin: ORIGIN }
) {
  return new Request(`${ORIGIN}/api/transactions/bulk`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/transactions/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const validRow = {
  type: "buy",
  quantity: "10",
  unit: "chi",
  pricePerUnit: "300.5",
  currency: "USD",
  transactionDate: "2026-01-15",
};

describe("POST /api/transactions/bulk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRateLimitedMock.mockResolvedValue(false);
    authMock.mockResolvedValue({ userId: "user_123" });
  });

  it("returns 401 and never touches the DB without a session", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await POST(jsonRequest({ transactions: [validRow] }));
    expect(res.status).toBe(401);
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate-limited", async () => {
    isRateLimitedMock.mockResolvedValue(true);
    const res = await POST(jsonRequest({ transactions: [validRow] }));
    expect(res.status).toBe(429);
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON body with 400", async () => {
    const res = await POST(jsonRequest("not json"));
    expect(res.status).toBe(400);
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it(`enforces the ${MAX_BULK_ROWS}-row cap`, async () => {
    const rows = Array.from({ length: MAX_BULK_ROWS + 1 }, () => validRow);
    const res = await POST(jsonRequest({ transactions: rows }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe("TOO_MANY_ROWS");
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("returns 400 with a per-index issue list for a bad row", async () => {
    const res = await POST(
      jsonRequest({
        transactions: [validRow, { ...validRow, quantity: "-5" }],
      })
    );
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe("INVALID_INPUT");
    expect(body.issues).toEqual(
      expect.arrayContaining([expect.objectContaining({ index: 1 })])
    );
    expect(createManyMock).not.toHaveBeenCalled();
  });

  it("inserts every valid row scoped to the session user and returns the count", async () => {
    createManyMock.mockResolvedValue([{ id: "a" }, { id: "b" }]);
    const res = await POST(
      jsonRequest({ transactions: [validRow, { ...validRow, quantity: "5" }] })
    );
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(createManyMock).toHaveBeenCalledWith(
      "user_123",
      expect.arrayContaining([expect.objectContaining({ type: "buy" })])
    );
    expect(body).toEqual({ data: { inserted: 2 } });
  });

  it("rejects an empty transactions array", async () => {
    const res = await POST(jsonRequest({ transactions: [] }));
    expect(res.status).toBe(400);
    expect(createManyMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/transactions/bulk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isRateLimitedMock.mockResolvedValue(false);
    authMock.mockResolvedValue({ userId: "user_123" });
    deleteManyMock.mockResolvedValue([{ id: uuid(1) }, { id: uuid(2) }]);
  });

  it("returns 401 and never touches the DB without a session", async () => {
    authMock.mockResolvedValue({ userId: null });
    const res = await DELETE(deleteRequest({ ids: [uuid(1)] }));
    expect(res.status).toBe(401);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate-limited", async () => {
    isRateLimitedMock.mockResolvedValue(true);
    const res = await DELETE(deleteRequest({ ids: [uuid(1)] }));
    expect(res.status).toBe(429);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("rejects a cross-origin request with 403", async () => {
    const res = await DELETE(
      deleteRequest({ ids: [uuid(1)] }, { Origin: "http://evil.example" })
    );
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe("CROSS_ORIGIN");
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON body with 400", async () => {
    const res = await DELETE(deleteRequest("not json"));
    expect(res.status).toBe(400);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it(`enforces the ${MAX_BULK_ROWS}-row cap`, async () => {
    const ids = Array.from({ length: MAX_BULK_ROWS + 1 }, (_, i) => uuid(i));
    const res = await DELETE(deleteRequest({ ids }));
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe("TOO_MANY_ROWS");
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("rejects an empty id list", async () => {
    const res = await DELETE(deleteRequest({ ids: [] }));
    expect(res.status).toBe(400);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("rejects ids that aren't uuids", async () => {
    const res = await DELETE(deleteRequest({ ids: ["temp-abc"] }));
    expect(res.status).toBe(400);
    expect(deleteManyMock).not.toHaveBeenCalled();
  });

  it("deletes the caller's rows and returns the removed count", async () => {
    deleteManyMock.mockResolvedValue([{ id: uuid(1) }]);
    const res = await DELETE(deleteRequest({ ids: [uuid(1), uuid(9)] }));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(deleteManyMock).toHaveBeenCalledWith("user_123", [uuid(1), uuid(9)]);
    expect(body).toEqual({ data: { deleted: 1 } });
  });
});
