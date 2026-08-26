"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateField } from "@/components/ui/date-field";
import { cn } from "@/lib/utils";
import { formatQuantity } from "@/lib/format/money";

export interface EditableTransaction {
  id: string;
  type: "buy" | "sell";
  quantity: string;
  unit: "chi" | "damlung";
  pricePerUnit: string;
  currency: "USD" | "KHR";
  transactionDate: string;
  notes?: string | null;
}

export type AddSettledResult =
  | { ok: true }
  | { ok: false; message: string };

// Add mode (no `transaction`) renders its own trigger button and manages
// its own open state. Edit mode (`transaction` present) is controlled by
// the caller via `open`/`onOpenChange` — the row's "⋯" menu decides when
// it's open, this component has no trigger of its own in that mode.
//
// `onOptimisticAdd`/`onAddSettled` are add-mode-only and optional — when
// given (from TransactionHistory), the dialog closes immediately on submit
// and hands the caller an optimistic row plus a settle callback, mirroring
// the optimistic delete flow. Without them (EmptyState's usage), the dialog
// keeps its original close-after-success behavior.
export function TransactionDialog({
  transaction,
  open,
  onOpenChange,
  onOptimisticAdd,
  onAddSettled,
}: {
  transaction?: EditableTransaction;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOptimisticAdd?: (row: EditableTransaction) => void;
  onAddSettled?: (tempId: string, result: AddSettledResult) => void;
}) {
  const isEdit = transaction !== undefined;
  const isOptimistic = !isEdit && onOptimisticAdd !== undefined;
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [type, setType] = useState<"buy" | "sell">(transaction?.type ?? "buy");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogOpen = isEdit ? (open ?? false) : internalOpen;
  const setDialogOpen = isEdit ? (onOpenChange ?? (() => {})) : setInternalOpen;

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    const payload = {
      type,
      quantity: formData.get("quantity"),
      unit: formData.get("unit"),
      pricePerUnit: formData.get("pricePerUnit"),
      currency: formData.get("currency"),
      transactionDate: formData.get("transactionDate"),
      notes: formData.get("notes") || undefined,
    };

    let tempId: string | undefined;
    if (isOptimistic) {
      tempId = `temp-${crypto.randomUUID()}`;
      onOptimisticAdd!({
        id: tempId,
        type,
        quantity: String(payload.quantity),
        unit: payload.unit as "chi" | "damlung",
        pricePerUnit: String(payload.pricePerUnit),
        currency: payload.currency as "USD" | "KHR",
        transactionDate: String(payload.transactionDate),
        notes: payload.notes ? String(payload.notes) : null,
      });
      setDialogOpen(false);
    }

    let res: Response;
    try {
      res = await fetch(
        isEdit ? `/api/transactions/${transaction.id}` : "/api/transactions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
    } catch {
      setSubmitting(false);
      const message = "Couldn't reach the server — the transaction was not saved.";
      if (isOptimistic) {
        onAddSettled!(tempId!, { ok: false, message });
        return;
      }
      setError(message);
      return;
    }

    const body = await res.json();
    setSubmitting(false);

    if (!res.ok || "error" in body) {
      const message = body.error?.message ?? "Something went wrong";
      if (isOptimistic) {
        onAddSettled!(tempId!, { ok: false, message });
        return;
      }
      setError(message);
      return;
    }

    if (isOptimistic) {
      onAddSettled!(tempId!, { ok: true });
    } else {
      setDialogOpen(false);
    }
    router.refresh();
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {!isEdit && (
        <DialogTrigger
          render={
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Add transaction
            </Button>
          }
        />
      )}
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the details of this transaction."
              : "Record a buy or sell against your gold holdings."}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="grid gap-6 pt-1">
          <div className="grid grid-cols-2 gap-2">
            {(["buy", "sell"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={cn(
                  "rounded-sm border py-2 text-[13.5px] font-medium capitalize transition-colors",
                  type === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <div className="flex gap-2">
              <Input
                id="quantity"
                name="quantity"
                type="number"
                step="any"
                min="0"
                defaultValue={
                  transaction ? formatQuantity(transaction.quantity) : undefined
                }
                required
                className="flex-1"
              />
              <Select
                name="unit"
                defaultValue={transaction?.unit ?? "chi"}
                required
              >
                <SelectTrigger id="unit" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chi">Chi</SelectItem>
                  <SelectItem value="damlung">Damlung</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="pricePerUnit">Price per unit</Label>
            <div className="flex gap-2">
              <Input
                id="pricePerUnit"
                name="pricePerUnit"
                type="number"
                step="any"
                min="0"
                defaultValue={transaction?.pricePerUnit}
                required
                className="flex-1"
              />
              <Select
                name="currency"
                defaultValue={transaction?.currency ?? "USD"}
                required
              >
                <SelectTrigger id="currency" className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="KHR">KHR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="transactionDate">Date</Label>
            <DateField
              name="transactionDate"
              defaultValue={transaction?.transactionDate}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="notes" className="text-muted-foreground">
              Notes (optional)
            </Label>
            <Input id="notes" name="notes" defaultValue={transaction?.notes ?? undefined} />
          </div>

          {error && <p className="text-[12.5px] text-destructive">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? "Saving…" : "Save transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
