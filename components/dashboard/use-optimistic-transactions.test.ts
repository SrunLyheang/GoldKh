// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOptimisticTransactions } from "./use-optimistic-transactions";
import type { TransactionRow } from "./transaction-history";
import type { EditableTransaction } from "./transaction-dialog";

function serverRow(overrides: Partial<TransactionRow> = {}): TransactionRow {
  return {
    id: "server-1",
    type: "buy",
    quantity: "10",
    unit: "chi",
    pricePerUnit: "300",
    currency: "USD",
    transactionDate: "2026-08-01",
    ...overrides,
  };
}

function pendingRow(overrides: Partial<EditableTransaction> = {}): EditableTransaction {
  return {
    id: "temp-1",
    type: "buy",
    quantity: "5",
    unit: "chi",
    pricePerUnit: "310",
    currency: "USD",
    transactionDate: "2026-08-27",
    ...overrides,
  };
}

describe("useOptimisticTransactions", () => {
  it("merges pending adds ahead of server rows", () => {
    const { result } = renderHook(() => useOptimisticTransactions([serverRow()]));

    act(() => result.current.addOptimistic(pendingRow()));

    expect(result.current.rows.map((r) => r.id)).toEqual(["temp-1", "server-1"]);
  });

  it("keeps a pending add until the server rows actually contain it", () => {
    const { result, rerender } = renderHook(
      ({ rows }) => useOptimisticTransactions(rows),
      { initialProps: { rows: [serverRow()] } }
    );

    act(() => result.current.addOptimistic(pendingRow()));
    act(() => result.current.settleAdd("temp-1", { ok: true }));

    // Confirmed, but `serverRows` hasn't caught up yet — still pending.
    expect(result.current.rows.map((r) => r.id)).toEqual(["temp-1", "server-1"]);

    rerender({ rows: [serverRow({ id: "server-2" }), serverRow()] });

    expect(result.current.rows.map((r) => r.id)).toEqual(["server-2", "server-1"]);
  });

  it("drops the pending add on a failed settle", () => {
    const { result } = renderHook(() => useOptimisticTransactions([serverRow()]));

    act(() => result.current.addOptimistic(pendingRow()));
    act(() =>
      result.current.settleAdd("temp-1", { ok: false, message: "boom" })
    );

    expect(result.current.rows.map((r) => r.id)).toEqual(["server-1"]);
  });

  it("an unrelated delete mid-flight does not clear a still-pending add", () => {
    const { result, rerender } = renderHook(
      ({ rows }) => useOptimisticTransactions(rows),
      { initialProps: { rows: [serverRow()] } }
    );

    act(() => result.current.addOptimistic(pendingRow()));
    act(() => result.current.markRemoved("server-1"));

    // `serverRows` unchanged by the delete yet — the effect should not
    // have fired, so the pending add is still there.
    rerender({ rows: [serverRow()] });
    expect(result.current.rows.map((r) => r.id)).toEqual(["temp-1"]);
  });

  it("markRemoved hides a row and unmarkRemoved restores it", () => {
    const { result } = renderHook(() => useOptimisticTransactions([serverRow()]));

    act(() => result.current.markRemoved("server-1"));
    expect(result.current.rows).toEqual([]);

    act(() => result.current.unmarkRemoved("server-1"));
    expect(result.current.rows.map((r) => r.id)).toEqual(["server-1"]);
  });
});
