import { Coins } from "lucide-react";
import {
  TransactionDialog,
  type AddSettledResult,
  type EditableTransaction,
} from "./transaction-dialog";

// Forwards the same optimistic-add callbacks TransactionHistory uses —
// DashboardContent renders whichever of these two is showing, and both
// need to feed the same merged `rows` so the very first transaction
// flips this screen over to the real dashboard content instantly rather
// than waiting on router.refresh().
export function EmptyState({
  onOptimisticAdd,
  onAddSettled,
}: {
  onOptimisticAdd: (row: EditableTransaction) => void;
  onAddSettled: (tempId: string, result: AddSettledResult) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
        <Coins className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-4 text-[15px] font-semibold text-foreground">
        No holdings yet
      </p>
      <p className="mt-1 max-w-xs text-[13.5px] text-muted-foreground">
        Record your first buy to start tracking your gold against the live
        spot price.
      </p>
      <div className="mt-5">
        <TransactionDialog
          onOptimisticAdd={onOptimisticAdd}
          onAddSettled={onAddSettled}
        />
      </div>
    </div>
  );
}
