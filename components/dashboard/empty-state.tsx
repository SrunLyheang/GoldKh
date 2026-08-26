import { Coins } from "lucide-react";
import { AddTransactionDialog } from "./add-transaction-dialog";

export function EmptyState() {
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
        <AddTransactionDialog />
      </div>
    </div>
  );
}
