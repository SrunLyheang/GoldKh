import { describe, expect, it } from "vitest";
import {
  classifyPrice,
  isHardVerdict,
  isSoftVerdict,
} from "./priceSanity";

const SPOT = 300;

describe("classifyPrice", () => {
  it("returns 'ok' when the price sits at spot", () => {
    expect(classifyPrice(300, SPOT)).toBe("ok");
  });

  it("returns 'ok' anywhere inside the soft band (0.5×–2×)", () => {
    expect(classifyPrice(150, SPOT)).toBe("ok"); // exactly 0.5×
    expect(classifyPrice(600, SPOT)).toBe("ok"); // exactly 2×
    expect(classifyPrice(200, SPOT)).toBe("ok");
    expect(classifyPrice(450, SPOT)).toBe("ok");
  });

  it("flags a soft-low verdict below 0.5× but at or above 0.1×", () => {
    expect(classifyPrice(149, SPOT)).toBe("soft-low");
    expect(classifyPrice(30, SPOT)).toBe("soft-low"); // exactly 0.1×
  });

  it("flags a soft-high verdict above 2× but at or below 10×", () => {
    expect(classifyPrice(601, SPOT)).toBe("soft-high");
    expect(classifyPrice(3000, SPOT)).toBe("soft-high"); // exactly 10×
  });

  it("flags a hard-low verdict below 0.1× spot", () => {
    expect(classifyPrice(29, SPOT)).toBe("hard-low");
    expect(classifyPrice(3, SPOT)).toBe("hard-low"); // an extra zero dropped
  });

  it("flags a hard-high verdict above 10× spot", () => {
    expect(classifyPrice(3001, SPOT)).toBe("hard-high");
    expect(classifyPrice(30000, SPOT)).toBe("hard-high"); // an extra zero added
  });

  it("returns 'ok' for non-positive or non-finite inputs", () => {
    expect(classifyPrice(0, SPOT)).toBe("ok");
    expect(classifyPrice(-100, SPOT)).toBe("ok");
    expect(classifyPrice(NaN, SPOT)).toBe("ok");
    expect(classifyPrice(300, 0)).toBe("ok");
    expect(classifyPrice(300, NaN)).toBe("ok");
    expect(classifyPrice(Infinity, SPOT)).toBe("ok");
  });
});

describe("isHardVerdict / isSoftVerdict", () => {
  it("classifies hard verdicts", () => {
    expect(isHardVerdict("hard-low")).toBe(true);
    expect(isHardVerdict("hard-high")).toBe(true);
    expect(isHardVerdict("soft-low")).toBe(false);
    expect(isHardVerdict("ok")).toBe(false);
  });

  it("classifies soft verdicts", () => {
    expect(isSoftVerdict("soft-low")).toBe(true);
    expect(isSoftVerdict("soft-high")).toBe(true);
    expect(isSoftVerdict("hard-high")).toBe(false);
    expect(isSoftVerdict("ok")).toBe(false);
  });
});
