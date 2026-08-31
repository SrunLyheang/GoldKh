import { describe, expect, it } from "vitest";
import {
  serializeTransactionsCsv,
  CSV_HEADER,
  type SerializableTransaction,
} from "./serializeTransactionsCsv";

function tx(
  overrides: Partial<SerializableTransaction> = {}
): SerializableTransaction {
  return {
    type: "buy",
    quantity: "10",
    unit: "chi",
    pricePerUnit: "300",
    currency: "USD",
    transactionDate: "2026-08-01",
    notes: null,
    ...overrides,
  };
}

describe("serializeTransactionsCsv", () => {
  it("emits the fixed header first", () => {
    const csv = serializeTransactionsCsv([]);
    expect(csv).toBe(CSV_HEADER + "\r\n");
  });

  it("writes total_paid as pricePerUnit x quantity", () => {
    const csv = serializeTransactionsCsv([
      tx({ pricePerUnit: "300", quantity: "10" }),
    ]);
    const [, row] = csv.trim().split("\r\n");
    expect(row).toBe("buy,10,chi,3000,USD,2026-08-01,");
  });

  it("rounds total_paid to 2 decimal places", () => {
    const csv = serializeTransactionsCsv([
      tx({ pricePerUnit: "1861.6667", quantity: "3" }),
    ]);
    const [, row] = csv.trim().split("\r\n");
    // 1861.6667 * 3 = 5585.0001 -> 5585
    expect(row.split(",")[3]).toBe("5585");
  });

  it("quotes a notes field that contains a comma, quote, or newline", () => {
    const csv = serializeTransactionsCsv([
      tx({ notes: 'bought at "Ly, Gold" shop\nnear market' }),
    ]);
    expect(csv).toContain('"bought at ""Ly, Gold"" shop\nnear market"');
  });

  it("round-trips a plain notes string without quoting", () => {
    const csv = serializeTransactionsCsv([tx({ notes: "anniversary gift" })]);
    const [, row] = csv.trim().split("\r\n");
    expect(row.endsWith(",anniversary gift")).toBe(true);
  });

  it.each([
    ["=", "=1+1"],
    ["+", "+1"],
    ["-", "-1"],
    ["@", "@SUM(A1:A9)"],
  ])(
    "neutralizes a notes value beginning with %s before escaping",
    (_prefix, note) => {
      const csv = serializeTransactionsCsv([tx({ notes: note })]);
      const [, row] = csv.trim().split("\r\n");
      expect(row.endsWith(`,'${note}`)).toBe(true);
    }
  );

  it("neutralizes a formula-prefixed note that also needs RFC-4180 quoting", () => {
    const csv = serializeTransactionsCsv([tx({ notes: "=HYPERLINK(x), y" })]);
    const [, row] = csv.trim().split("\r\n");
    expect(row.endsWith(`,"'=HYPERLINK(x), y"`)).toBe(true);
  });

  it("leaves a note that merely contains =, +, -, or @ mid-string unchanged", () => {
    const csv = serializeTransactionsCsv([tx({ notes: "1+1 gift @ noon" })]);
    const [, row] = csv.trim().split("\r\n");
    expect(row.endsWith(",1+1 gift @ noon")).toBe(true);
  });

  it("keeps KHR rows with their large integer totals", () => {
    const csv = serializeTransactionsCsv([
      tx({ currency: "KHR", pricePerUnit: "1200000", quantity: "2", unit: "damlung" }),
    ]);
    const [, row] = csv.trim().split("\r\n");
    expect(row).toBe("buy,2,damlung,2400000,KHR,2026-08-01,");
  });
});
