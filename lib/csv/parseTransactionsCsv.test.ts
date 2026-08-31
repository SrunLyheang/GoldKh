import { describe, expect, it } from "vitest";
import { parseTransactionsCsv } from "./parseTransactionsCsv";

const HEADER = "type,quantity,unit,total_paid,currency,date,notes";

describe("parseTransactionsCsv", () => {
  it("flags an empty file", () => {
    expect(parseTransactionsCsv("").fileError).toBe("empty");
    expect(parseTransactionsCsv("   \n  ").fileError).toBe("empty");
  });

  it("flags a file whose header is missing a required column", () => {
    const res = parseTransactionsCsv("type,quantity,unit\nbuy,10,chi");
    expect(res.fileError).toBe("header");
  });

  it("accepts a header in any case/order and ignores unknown columns", () => {
    const res = parseTransactionsCsv(
      "Date,TYPE,Quantity,Unit,Total_Paid,Currency,Notes,extra\n" +
        "2026-08-01,buy,10,chi,3000,USD,gift,zzz"
    );
    expect(res.fileError).toBeUndefined();
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].valid).toBe(true);
    expect(res.rows[0].input).toMatchObject({
      type: "buy",
      quantity: "10",
      unit: "chi",
      currency: "USD",
      transactionDate: "2026-08-01",
      notes: "gift",
    });
  });

  it("derives pricePerUnit as total_paid / quantity, 4 dp", () => {
    const res = parseTransactionsCsv(`${HEADER}\nbuy,3,chi,5585,USD,2026-08-01,`);
    expect(res.rows[0].input?.pricePerUnit).toBe("1861.6667");
  });

  it("marks a row invalid when the schema rejects it, with the first message", () => {
    const res = parseTransactionsCsv(
      `${HEADER}\nbuy,-2,chi,100,USD,2026-08-01,`
    );
    expect(res.rows[0].valid).toBe(false);
    expect(res.rows[0].error).toBeTruthy();
    expect(res.rows[0].input).toBeUndefined();
  });

  it("marks a row invalid for a future date", () => {
    const res = parseTransactionsCsv(
      `${HEADER}\nbuy,2,chi,100,USD,3999-01-01,`
    );
    expect(res.rows[0].valid).toBe(false);
  });

  it("marks a row invalid when quantity is zero (no divide-by-zero throw)", () => {
    const res = parseTransactionsCsv(`${HEADER}\nbuy,0,chi,100,USD,2026-08-01,`);
    expect(res.rows[0].valid).toBe(false);
  });

  it("parses quoted fields with embedded commas, quotes, and newlines", () => {
    const csv =
      `${HEADER}\r\n` +
      `buy,10,chi,3000,USD,2026-08-01,"bought at ""Ly, Gold""\nnear market"\r\n`;
    const res = parseTransactionsCsv(csv);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].input?.notes).toBe(
      'bought at "Ly, Gold"\nnear market'
    );
  });

  it("skips blank lines but keeps 1-based source line numbers", () => {
    const csv = `${HEADER}\n\nbuy,10,chi,3000,USD,2026-08-01,\n`;
    const res = parseTransactionsCsv(csv);
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0].line).toBe(3);
  });

  it("reports a row whose column count does not match the header", () => {
    const res = parseTransactionsCsv(`${HEADER}\nbuy,10,chi\n`);
    expect(res.rows[0].valid).toBe(false);
    expect(res.rows[0].error).toBeTruthy();
  });
});
