"use client";

import Decimal from "decimal.js";
import { TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { toDateKey } from "@/components/ui/calendar";
import { LoadingScreen } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { transactionInputSchema } from "@/lib/validation/transaction";
import { computeHoldings, type TransactionWithId } from "@/lib/calc/holdings";
import { fromTroyOz, priceFromTroyOz, toTroyOz } from "@/lib/calc/units";

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

// A number the user might still be mid-typing ("1.", "", ".5") — cheap
// shape check before handing it to Decimal, which throws on anything
// that isn't a complete number.
function isParseableNumber(value: string): boolean {
  return /^\d*\.?\d*$/.test(value) && value !== "" && value !== ".";
}

// Always fully controlled by the caller (`open`/`onOpenChange`) — no
// built-in trigger button in either mode. Add's trigger buttons live in
// EmptyState and TransactionHistory's header, but both open the SAME
// dialog instance rendered once in DashboardContent: if each caller
// rendered its own TransactionDialog, the one inside EmptyState would get
// unmounted mid-request the instant the optimistic row flips `rows` from
// empty to non-empty (DashboardContent swaps EmptyState out for the real
// table) — losing this dialog's loading state before the user ever sees
// it. A single shared instance survives that swap.
//
// Every field is controlled state (not `defaultValue`/FormData) — this
// is what lets a failed submit re-show the form with everything the user
// typed still in place, since the dialog instance itself never unmounts
// (only the `submitting ? LoadingScreen : form` branch swaps), and it's
// the same reason `type` was already state before this: an uncontrolled
// input remounts fresh from its original default the moment that branch
// swaps back, discarding whatever was typed.
//
// `onOptimisticAdd` (add-mode only) fires immediately on submit so the
// dashboard reflects the new row right away, but the dialog itself always
// stays open showing `LoadingScreen` until the request settles — it does
// NOT close early. Success closes it; failure rolls the optimistic row
// back (via `onAddSettled`) and returns to the form with an error, same
// as the non-optimistic path.
export function TransactionDialog({
  transaction,
  open,
  onOpenChange,
  onOptimisticAdd,
  onAddSettled,
  onEditSuccess,
  currentPricePerTroyOz,
  existingTransactions,
}: {
  transaction?: EditableTransaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOptimisticAdd?: (row: EditableTransaction) => void;
  onAddSettled?: (tempId: string, result: AddSettledResult) => void;
  onEditSuccess?: () => void;
  currentPricePerTroyOz: string;
  existingTransactions: TransactionWithId[];
}) {
  const isEdit = transaction !== undefined;
  const isOptimistic = !isEdit && onOptimisticAdd !== undefined;
  const router = useRouter();

  const [type, setType] = useState<"buy" | "sell">(transaction?.type ?? "buy");
  const [quantity, setQuantity] = useState(
    transaction ? formatQuantity(transaction.quantity) : ""
  );
  const [unit, setUnit] = useState<"chi" | "damlung">(transaction?.unit ?? "chi");
  const [pricePerUnit, setPricePerUnit] = useState(transaction?.pricePerUnit ?? "");
  const [currency, setCurrency] = useState<"USD" | "KHR">(transaction?.currency ?? "USD");
  const [transactionDate, setTransactionDate] = useState(
    transaction?.transactionDate ?? toDateKey(new Date())
  );
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const payload = {
    type,
    quantity,
    unit,
    pricePerUnit,
    currency,
    transactionDate,
    notes: notes || undefined,
  };
  const parsed = transactionInputSchema.safeParse(payload);
  const fieldErrors = parsed.success ? {} : parsed.error.flatten().fieldErrors;

  function fieldError(field: keyof typeof fieldErrors): string | undefined {
    if (!touched[field] && !attemptedSubmit) return undefined;
    return fieldErrors[field]?.[0];
  }

  const totalCost =
    isParseableNumber(quantity) && isParseableNumber(pricePerUnit)
      ? new Decimal(quantity).times(pricePerUnit).toString()
      : null;
  const spotPerUnit = priceFromTroyOz(currentPricePerTroyOz, unit);

  const holdingsExcludingSelf = useMemo(
    () =>
      computeHoldings(
        existingTransactions.filter((t) => t.id !== transaction?.id)
      ),
    [existingTransactions, transaction?.id]
  );
  const exceedsHoldings =
    type === "sell" &&
    isParseableNumber(quantity) &&
    new Decimal(toTroyOz(quantity, unit)).gt(holdingsExcludingSelf.totalTroyOz);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError(null);

    if (!parsed.success) {
      return;
    }

    setSubmitting(true);

    let tempId: string | undefined;
    if (isOptimistic) {
      tempId = `temp-${crypto.randomUUID()}`;
      onOptimisticAdd!({
        id: tempId,
        type,
        quantity,
        unit,
        pricePerUnit,
        currency,
        transactionDate,
        notes: notes || null,
      });
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
      }
      setError(message);
      return;
    }

    if (isOptimistic) {
      onAddSettled!(tempId!, { ok: true });
    }
    if (isEdit) {
      onEditSuccess?.();
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        {submitting ? (
          <LoadingScreen
            label={isEdit ? "Saving changes…" : "Saving transaction…"}
            className="min-h-56"
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isEdit ? "Edit transaction" : "Add transaction"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Update the details of this transaction."
                  : "Record a buy or sell against your gold holdings."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-6 pt-1">
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
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    onBlur={() => touch("quantity")}
                    aria-invalid={!!fieldError("quantity")}
                    required
                    className="flex-1"
                  />
                  <Select
                    name="unit"
                    value={unit}
                    onValueChange={(value) => setUnit(value as "chi" | "damlung")}
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
                {fieldError("quantity") && (
                  <p className="text-[11.5px] text-destructive">{fieldError("quantity")}</p>
                )}
                {exceedsHoldings && (
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      This exceeds your current holdings of{" "}
                      {formatQuantity(fromTroyOz(holdingsExcludingSelf.totalTroyOz, unit))}{" "}
                      {unit}.
                    </span>
                  </div>
                )}
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
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    onBlur={() => touch("pricePerUnit")}
                    aria-invalid={!!fieldError("pricePerUnit")}
                    required
                    className="flex-1"
                  />
                  <Select
                    name="currency"
                    value={currency}
                    onValueChange={(value) => setCurrency(value as "USD" | "KHR")}
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
                {fieldError("pricePerUnit") && (
                  <p className="text-[11.5px] text-destructive">{fieldError("pricePerUnit")}</p>
                )}
              </div>

              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total cost</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {totalCost === null
                      ? "—"
                      : currency === "USD"
                        ? formatUsd(totalCost)
                        : `${new Intl.NumberFormat("en-US").format(Number(totalCost))} KHR`}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Current spot</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {formatUsd(spotPerUnit)}/{unit}
                  </span>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="transactionDate">Date</Label>
                <DateField
                  name="transactionDate"
                  value={transactionDate}
                  onChange={setTransactionDate}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="notes" className="text-muted-foreground">
                  Notes (optional)
                </Label>
                <Input
                  id="notes"
                  name="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => touch("notes")}
                  aria-invalid={!!fieldError("notes")}
                />
                {fieldError("notes") && (
                  <p className="text-[11.5px] text-destructive">{fieldError("notes")}</p>
                )}
              </div>

              {error && <p className="text-[12.5px] text-destructive">{error}</p>}

              <Button type="submit" disabled={submitting} className="w-full">
                Save transaction
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
