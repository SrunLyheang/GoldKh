"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Confirm step for the transaction list's bulk-delete action. Locale is
// en-only and dictionary.ts is frozen for this phase (see progress-tracker
// "Phase 0"), so the copy is inline English, matching the "Transaction
// deleted." precedent in the surrounding files.
export function BulkDeleteDialog({
  open,
  onOpenChange,
  count,
  pending = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  pending?: boolean;
  onConfirm: () => void;
}) {
  const noun = count === 1 ? "transaction" : "transactions";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Delete {count} {noun}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the selected {noun} from your ledger. This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Deleting…" : `Delete ${count} ${noun}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
