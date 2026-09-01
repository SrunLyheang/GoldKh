// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useValuePulse } from "./use-value-pulse";

describe("useValuePulse", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not pulse on first render", () => {
    const { result } = renderHook(() => useValuePulse("$100.00"));
    expect(result.current).toBe(false);
  });

  it("pulses for ~600ms after the value changes, then settles", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useValuePulse(value),
      { initialProps: { value: "$100.00" } }
    );
    expect(result.current).toBe(false);

    rerender({ value: "$250.00" });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current).toBe(false);
  });

  it("does not pulse when the value re-renders unchanged", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useValuePulse(value),
      { initialProps: { value: "$100.00" } }
    );
    rerender({ value: "$100.00" });
    expect(result.current).toBe(false);
  });
});
