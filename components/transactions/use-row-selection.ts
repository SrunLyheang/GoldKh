import { useCallback, useMemo, useState } from "react";

// Multi-select state for the transaction list's bulk-delete action.
// Shared by the dashboard panel and the full /dashboard/transactions
// view so the two can't drift on how selection behaves. Selection is
// ephemeral — not persisted, not in the URL (see the bulk-delete design,
// YAGNI trims).
export function useRowSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Select-all is scoped to the ids passed in (the currently *visible*,
  // i.e. filtered, rows). If every one is already selected it clears them,
  // otherwise it adds the missing ones — anything selected but not in
  // `ids` is left untouched.
  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const everyVisibleSelected =
        ids.length > 0 && ids.every((id) => prev.has(id));
      const next = new Set(prev);
      if (everyVisibleSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  const allSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.has(id)),
    [selectedIds]
  );

  const selectedCount = selectedIds.size;
  const selectedArray = useMemo(() => [...selectedIds], [selectedIds]);

  return {
    selectedIds,
    selectedArray,
    selectedCount,
    toggle,
    toggleAll,
    clear,
    allSelected,
  };
}
