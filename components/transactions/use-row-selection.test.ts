// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useRowSelection } from "./use-row-selection";

describe("useRowSelection", () => {
  it("toggles a single id on and off", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggle("a"));
    expect(result.current.selectedArray).toEqual(["a"]);
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.toggle("a"));
    expect(result.current.selectedArray).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
  });

  it("toggleAll selects every visible id, then clears them on a second call", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b", "c"]));
    expect(result.current.selectedArray.sort()).toEqual(["a", "b", "c"]);
    expect(result.current.allSelected(["a", "b", "c"])).toBe(true);

    act(() => result.current.toggleAll(["a", "b", "c"]));
    expect(result.current.selectedArray).toEqual([]);
  });

  it("toggleAll fills in the missing ids without dropping an out-of-scope selection", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggle("x"));
    act(() => result.current.toggleAll(["a", "b"]));

    expect(result.current.selectedArray.sort()).toEqual(["a", "b", "x"]);
    // "x" isn't in the visible set, so the header checkbox reads unchecked.
    expect(result.current.allSelected(["a", "b"])).toBe(true);
  });

  it("allSelected is false for an empty visible set", () => {
    const { result } = renderHook(() => useRowSelection());
    expect(result.current.allSelected([])).toBe(false);
  });

  it("clear drops everything", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b"]));
    act(() => result.current.clear());

    expect(result.current.selectedArray).toEqual([]);
    expect(result.current.selectedCount).toBe(0);
  });
});
