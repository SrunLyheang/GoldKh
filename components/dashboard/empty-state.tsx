import { Coins, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Trigger-only — the actual dialog is a single shared instance owned by
// DashboardContent (see transaction-dialog.tsx's header comment for why:
// a dialog rendered here would get unmounted mid-request the instant the
// first optimistic add flips DashboardContent from this screen to the
// real table).
export function EmptyState({ onAddClick }: { onAddClick: () => void }) {
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
        <Button size="sm" onClick={onAddClick}>
          <Plus className="h-4 w-4" />
          Add transaction
        </Button>
      </div>
    </div>
  );
}
