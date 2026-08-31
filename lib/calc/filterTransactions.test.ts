import { describe, expect, it } from "vitest";
import {
  filterTransactions,
  type FilterableTransaction,
  type FilterCriteria,
} from "./filterTransactions";

function tx(
  overrides: Partial<FilterableTransaction & { id: string }> = {}
): FilterableTransaction & { id: string } {
  return {
    id: "x",
    type: "buy",
    quantity: "10",
    unit: "chi",
    pricePerUnit: "300",
    currency: "USD",
    transactionDate: "2026-08-01",
    ...overrides,
  };
}

const PRICE = "2000"; // USD / troy oz

const run = (rows: ReturnType<typeof tx>[], c: FilterCriteria) =>
  filterTransactions(rows, c, PRICE).map((r) => r.id);

describe("filterTransactions — filtering", () => {
  it("returns all rows (date desc) with empty criteria", () => {
    const rows = [
      tx({ id: "a", transactionDate: "2026-08-01" }),
      tx({ id: "b", transactionDate: "2026-08-03" }),
      tx({ id: "c", transactionDate: "2026-08-02" }),
    ];
    expect(run(rows, {})).toEqual(["b", "c", "a"]);
  });

  it("matches amount paid within +/-10% of total (pricePerUnit x quantity)", () => {
    const rows = [
      tx({ id: "in", pricePerUnit: "300", quantity: "10" }), // 3000
      tx({ id: "edge", pricePerUnit: "330", quantity: "10" }), // 3300 == +10%
      tx({ id: "out", pricePerUnit: "340", quantity: "10" }), // 3400
    ];
    expect(run(rows, { amountPaid: 3000 }).sort()).toEqual(["edge", "in"]);
  });

  it("filters by inclusive date range", () => {
    const rows = [
      tx({ id: "a", transactionDate: "2026-08-01" }),
      tx({ id: "b", transactionDate: "2026-08-05" }),
      tx({ id: "c", transactionDate: "2026-08-10" }),
    ];
    expect(run(rows, { dateFrom: "2026-08-05", dateTo: "2026-08-10" }).sort()).toEqual(
      ["b", "c"]
    );
    expect(run(rows, { dateTo: "2026-08-01" })).toEqual(["a"]);
  });

  it("matches quantity exactly, and unit too when given", () => {
    const rows = [
      tx({ id: "chi10", quantity: "10", unit: "chi" }),
      tx({ id: "dam10", quantity: "10", unit: "damlung" }),
      tx({ id: "chi5", quantity: "5", unit: "chi" }),
    ];
    expect(run(rows, { quantity: 10 }).sort()).toEqual(["chi10", "dam10"]);
    expect(run(rows, { quantity: 10, quantityUnit: "chi" })).toEqual(["chi10"]);
  });

  it("filters by direction", () => {
    const rows = [
      tx({ id: "b1", type: "buy" }),
      tx({ id: "s1", type: "sell" }),
    ];
    expect(run(rows, { direction: "sell" })).toEqual(["s1"]);
    expect(run(rows, { direction: "all" }).sort()).toEqual(["b1", "s1"]);
  });

  it("AND-combines every active criterion", () => {
    const rows = [
      tx({ id: "hit", type: "buy", quantity: "10", unit: "chi", transactionDate: "2026-08-05" }),
      tx({ id: "wrongType", type: "sell", quantity: "10", unit: "chi", transactionDate: "2026-08-05" }),
      tx({ id: "wrongDate", type: "buy", quantity: "10", unit: "chi", transactionDate: "2026-09-05" }),
    ];
    expect(
      run(rows, {
        direction: "buy",
        quantity: 10,
        quantityUnit: "chi",
        dateFrom: "2026-08-01",
        dateTo: "2026-08-31",
      })
    ).toEqual(["hit"]);
  });
});

describe("filterTransactions — sorting", () => {
  it("sorts by date ascending when asked", () => {
    const rows = [
      tx({ id: "a", transactionDate: "2026-08-01" }),
      tx({ id: "b", transactionDate: "2026-08-03" }),
    ];
    expect(run(rows, { sortBy: "date", sortDir: "asc" })).toEqual(["a", "b"]);
  });

  it("sorts by P&L, nulls (sell / KHR) last", () => {
    const rows = [
      // buy 10 chi @ 300/chi -> cost 3000; current spot low -> negative P&L
      tx({ id: "loss", type: "buy", pricePerUnit: "300", quantity: "10", unit: "chi" }),
      // buy 1 chi @ 1/chi -> tiny cost, big gain
      tx({ id: "gain", type: "buy", pricePerUnit: "1", quantity: "1", unit: "chi" }),
      tx({ id: "sell", type: "sell" }),
    ];
    expect(run(rows, { sortBy: "pnl", sortDir: "desc" })).toEqual([
      "gain",
      "loss",
      "sell",
    ]);
  });
});
