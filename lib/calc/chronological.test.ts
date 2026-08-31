import { describe, expect, it } from "vitest";
import { toChronological } from "./chronological";
import { computeRealized } from "./realized";
import type { LedgerEntry } from "./ledgerEntry";

describe("toChronological", () => {
  it("reorders a newest-first list to oldest-first", () => {
    const rows = [
      { id: "c", transactionDate: "2026-08-31" },
      { id: "b", transactionDate: "2026-08-30" },
      { id: "a", transactionDate: "2026-08-01" },
    ];
    expect(toChronological(rows).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input", () => {
    const rows = [
      { id: "b", transactionDate: "2026-08-30" },
      { id: "a", transactionDate: "2026-08-01" },
    ];
    toChronological(rows);
    expect(rows.map((r) => r.id)).toEqual(["b", "a"]);
  });

  it("keeps same-day rows in the order given (stable)", () => {
    const rows = [
      { id: "first", transactionDate: "2026-08-30" },
      { id: "second", transactionDate: "2026-08-30" },
    ];
    expect(toChronological(rows).map((r) => r.id)).toEqual(["first", "second"]);
  });

  it("feeds computeRealized correctly from a newest-first ledger", () => {
    // The reported bug: buy 10 chi @ 5585/damlung on the 30th, sell 1
    // damlung @ 5200 on the 31st. Stored newest-first, the sell would be
    // replayed against an empty position and realized would read as the
    // full $5200 of proceeds at 0%. Oldest-first, it is the true -$385.
    type Row = LedgerEntry & { transactionDate: string };
    const newestFirst: Row[] = [
      {
        transactionDate: "2026-08-31",
        type: "sell",
        quantity: "1",
        unit: "damlung",
        pricePerUnit: "5200",
        currency: "USD",
      },
      {
        transactionDate: "2026-08-30",
        type: "buy",
        quantity: "10",
        unit: "chi",
        pricePerUnit: "558.5",
        currency: "USD",
      },
    ];

    const wrong = computeRealized(newestFirst);
    expect(Number(wrong.realizedUsd)).toBeCloseTo(5200, 6);

    const right = computeRealized(toChronological(newestFirst));
    expect(Number(right.realizedUsd)).toBeCloseTo(-385, 6);
    expect(Number(right.realizedPercent)).toBeCloseTo(-6.894, 2);
    expect(right.saleCount).toBe(1);
  });
});
