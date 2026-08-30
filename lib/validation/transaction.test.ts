import { describe, expect, it } from "vitest";
import {
  transactionInputSchema,
  transactionMessages,
} from "./transaction";

const base = {
  type: "buy" as const,
  quantity: "10",
  unit: "chi" as const,
  pricePerUnit: "300",
  currency: "USD" as const,
  transactionDate: "2026-01-15",
  notes: undefined,
};

function fieldError(payload: Record<string, unknown>, field: string) {
  const parsed = transactionInputSchema.safeParse(payload);
  if (parsed.success) return undefined;
  const fieldErrors = parsed.error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return fieldErrors[field]?.[0];
}

describe("transactionInputSchema", () => {
  it("accepts a well-formed buy", () => {
    expect(transactionInputSchema.safeParse(base).success).toBe(true);
  });

  describe("quantity", () => {
    it("rejects non-numeric text", () => {
      expect(fieldError({ ...base, quantity: "abc" }, "quantity")).toBe(
        transactionMessages.notANumber
      );
    });

    it("rejects a value with a thousands comma", () => {
      expect(fieldError({ ...base, quantity: "1,000" }, "quantity")).toBe(
        transactionMessages.notANumber
      );
    });

    it("rejects more than 4 decimal places", () => {
      expect(fieldError({ ...base, quantity: "1.23456" }, "quantity")).toBe(
        transactionMessages.tooManyDecimals
      );
    });

    it("rejects zero", () => {
      expect(fieldError({ ...base, quantity: "0" }, "quantity")).toBe(
        transactionMessages.quantityNotPositive
      );
    });

    it("rejects a quantity below the 0.01 chi floor", () => {
      expect(fieldError({ ...base, quantity: "0.001" }, "quantity")).toBe(
        transactionMessages.quantityTooSmall
      );
    });

    it("accepts exactly 0.01 chi", () => {
      expect(
        transactionInputSchema.safeParse({ ...base, quantity: "0.01" }).success
      ).toBe(true);
    });

    it("applies the floor in damlung-equivalent when the unit is damlung", () => {
      expect(
        fieldError(
          { ...base, unit: "damlung", quantity: "0.0005" },
          "quantity"
        )
      ).toBe(transactionMessages.quantityTooSmall);
      expect(
        transactionInputSchema.safeParse({
          ...base,
          unit: "damlung",
          quantity: "0.001",
        }).success
      ).toBe(true);
    });
  });

  describe("pricePerUnit", () => {
    it("rejects non-numeric text", () => {
      expect(fieldError({ ...base, pricePerUnit: "free" }, "pricePerUnit")).toBe(
        transactionMessages.notANumber
      );
    });

    it("rejects zero with the price-specific message", () => {
      expect(fieldError({ ...base, pricePerUnit: "0" }, "pricePerUnit")).toBe(
        transactionMessages.priceNotPositive
      );
    });

    it("rejects more than 4 decimal places", () => {
      expect(
        fieldError({ ...base, pricePerUnit: "300.00001" }, "pricePerUnit")
      ).toBe(transactionMessages.tooManyDecimals);
    });
  });

  describe("transactionDate", () => {
    it("rejects a malformed date", () => {
      expect(
        fieldError({ ...base, transactionDate: "15/01/2026" }, "transactionDate")
      ).toBe(transactionMessages.dateInvalid);
    });

    it("rejects a date well in the future", () => {
      expect(
        fieldError(
          { ...base, transactionDate: "2099-01-01" },
          "transactionDate"
        )
      ).toBe(transactionMessages.dateInFuture);
    });

    it("accepts today", () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(
        transactionInputSchema.safeParse({ ...base, transactionDate: today })
          .success
      ).toBe(true);
    });
  });

  describe("notes", () => {
    it("rejects notes longer than 500 characters", () => {
      expect(
        fieldError({ ...base, notes: "x".repeat(501) }, "notes")
      ).toBe(transactionMessages.notesTooLong);
    });

    it("accepts notes of exactly 500 characters", () => {
      expect(
        transactionInputSchema.safeParse({ ...base, notes: "x".repeat(500) })
          .success
      ).toBe(true);
    });
  });
});
