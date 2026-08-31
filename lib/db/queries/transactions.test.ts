import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateReturningMock, deleteReturningMock, selectWhereMock } = vi.hoisted(
  () => ({
    updateReturningMock: vi.fn(),
    deleteReturningMock: vi.fn(),
    selectWhereMock: vi.fn(),
  })
);

vi.mock("@/lib/db/client", () => ({
  db: {
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({ returning: updateReturningMock })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => ({ returning: deleteReturningMock })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({ where: selectWhereMock })),
    })),
  },
}));

import {
  deleteManyOwnedTransactions,
  deleteOwnedTransaction,
  updateOwnedTransaction,
} from "./transactions";

const payload = {
  type: "buy" as const,
  quantity: "10",
  unit: "chi" as const,
  pricePerUnit: "300.5",
  currency: "USD" as const,
  transactionDate: "2026-01-15",
};

describe("updateOwnedTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok with the row when the scoped update hits", async () => {
    const row = { id: "tx_1", userId: "user_123" };
    updateReturningMock.mockResolvedValue([row]);

    const result = await updateOwnedTransaction("user_123", "tx_1", payload);

    expect(result).toEqual({ ok: true, value: row });
    expect(selectWhereMock).not.toHaveBeenCalled();
  });

  it("returns forbidden when the row exists under another user", async () => {
    updateReturningMock.mockResolvedValue([]);
    selectWhereMock.mockResolvedValue([{ id: "tx_1" }]);

    const result = await updateOwnedTransaction("user_123", "tx_1", payload);

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("returns not_found when no row has that id", async () => {
    updateReturningMock.mockResolvedValue([]);
    selectWhereMock.mockResolvedValue([]);

    const result = await updateOwnedTransaction("user_123", "missing", payload);

    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("deleteOwnedTransaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok with the id when the scoped delete hits", async () => {
    deleteReturningMock.mockResolvedValue([{ id: "tx_1" }]);

    const result = await deleteOwnedTransaction("user_123", "tx_1");

    expect(result).toEqual({ ok: true, value: { id: "tx_1" } });
    expect(selectWhereMock).not.toHaveBeenCalled();
  });

  it("returns forbidden when the row exists under another user", async () => {
    deleteReturningMock.mockResolvedValue([]);
    selectWhereMock.mockResolvedValue([{ id: "tx_1" }]);

    const result = await deleteOwnedTransaction("user_123", "tx_1");

    expect(result).toEqual({ ok: false, reason: "forbidden" });
  });

  it("returns not_found when no row has that id", async () => {
    deleteReturningMock.mockResolvedValue([]);
    selectWhereMock.mockResolvedValue([]);

    const result = await deleteOwnedTransaction("user_123", "missing");

    expect(result).toEqual({ ok: false, reason: "not_found" });
  });
});

describe("deleteManyOwnedTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the ids the scoped delete actually removed", async () => {
    deleteReturningMock.mockResolvedValue([{ id: "tx_1" }, { id: "tx_2" }]);

    const result = await deleteManyOwnedTransactions("user_123", [
      "tx_1",
      "tx_2",
      "tx_other",
    ]);

    expect(result).toEqual([{ id: "tx_1" }, { id: "tx_2" }]);
  });

  it("short-circuits without touching the db on an empty id list", async () => {
    const { db } = await import("@/lib/db/client");

    const result = await deleteManyOwnedTransactions("user_123", []);

    expect(result).toEqual([]);
    expect(db.delete).not.toHaveBeenCalled();
  });
});
