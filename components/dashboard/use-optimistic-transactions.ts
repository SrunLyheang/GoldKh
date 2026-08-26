import { useEffect, useRef, useState } from "react";
import type { TransactionRow } from "./transaction-history";
import type { AddSettledResult, EditableTransaction } from "./transaction-dialog";

// Owns the reconciliation between the server's transaction list and two
// in-flight optimistic changes: an add not yet confirmed, and a delete
// not yet confirmed. Extracted out of DashboardContent so the temp-id/
// settle protocol has one interface a test can drive directly, instead
// of living only in how DashboardContent happens to call it.
export function useOptimisticTransactions(serverRows: TransactionRow[]) {
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [pendingAdds, setPendingAdds] = useState<EditableTransaction[]>([]);
  const awaitingAddRefresh = useRef(false);

  const rows: TransactionRow[] = [
    ...pendingAdds,
    ...serverRows.filter((row) => !removedIds.has(row.id)),
  ];

  // A confirmed add is still sitting in `pendingAdds` (its temp id would
  // 404 if the UI let it be edited/deleted) until the next server-backed
  // `serverRows` actually contains it. `awaitingAddRefresh` is a ref, not
  // state, so an unrelated delete happening mid-flight doesn't clear a
  // still-pending add.
  useEffect(() => {
    if (awaitingAddRefresh.current) {
      setPendingAdds([]);
      awaitingAddRefresh.current = false;
    }
  }, [serverRows]);

  function addOptimistic(row: EditableTransaction) {
    setPendingAdds((prev) => [row, ...prev]);
  }

  function settleAdd(tempId: string, result: AddSettledResult) {
    if (result.ok) {
      awaitingAddRefresh.current = true;
    } else {
      setPendingAdds((prev) => prev.filter((row) => row.id !== tempId));
    }
  }

  function markRemoved(id: string) {
    setRemovedIds((prev) => new Set(prev).add(id));
  }

  function unmarkRemoved(id: string) {
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return { rows, addOptimistic, settleAdd, markRemoved, unmarkRemoved };
}
