import { describe, expect, it } from "vitest";
import { classifyEntry, type LedgerEntry } from "./ledgerEntry";

function entry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    type: "buy",
    quantity: "1",
    unit: "damlung",
    pricePerUnit: "5000",
    currency: "USD",
    ...overrides,
  };
}

describe("classifyEntry", () => {
  it("classifies any non-USD entry as non-usd, regardless of type", () => {
    expect(classifyEntry(entry({ currency: "KHR", type: "buy" }))).toBe("non-usd");
    expect(classifyEntry(entry({ currency: "KHR", type: "sell" }))).toBe("non-usd");
  });

  it("classifies a USD sell as a sale", () => {
    expect(classifyEntry(entry({ type: "sell" }))).toBe("sale");
  });

  it("classifies a USD buy as an open-buy", () => {
    expect(classifyEntry(entry({ type: "buy" }))).toBe("open-buy");
  });
});
