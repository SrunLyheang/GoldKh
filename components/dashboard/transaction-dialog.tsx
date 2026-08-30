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
import { useLocale } from "@/lib/i18n/locale-context";
import { notify } from "@/lib/ui/toast";
import { cn } from "@/lib/utils";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { transactionInputSchema } from "@/lib/validation/transaction";
import {
  classifyPrice,
  isHardVerdict,
  isSoftVerdict,
} from "@/lib/validation/priceSanity";
import { computeHoldings } from "@/lib/calc/holdings";
import type { LedgerEntryWithId } from "@/lib/calc/ledgerEntry";
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

// The user enters the total they paid for the whole transaction; the
// ledger stores price per unit. Divide, then round to the schema's 4-dp
// cap — a stored pricePerUnit × quantity can then differ from the
// entered total by a sub-cent rounding remainder, which is acceptable at
// this scale. Returns "" while either input is still mid-typing or the
// quantity is zero (Decimal.div throws on divide-by-zero).
function derivePricePerUnit(totalPaid: string, quantity: string): string {
  if (
    !isParseableNumber(totalPaid) ||
    !isParseableNumber(quantity) ||
    Number(quantity) <= 0
  ) {
    return "";
  }
  return new Decimal(totalPaid).div(quantity).toDecimalPlaces(4).toString();
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
  existingTransactions: LedgerEntryWithId[];
}) {
  const isEdit = transaction !== undefined;
  const isOptimistic = !isEdit && onOptimisticAdd !== undefined;
  const router = useRouter();
  const { t } = useLocale();
  const unitLabel = (u: "chi" | "damlung") => (u === "chi" ? t.unit.chi : t.unit.damlung);
  const typeLabel = (option: "buy" | "sell") =>
    option === "buy" ? t.transactions.buy : t.transactions.sell;

  const [type, setType] = useState<"buy" | "sell">(transaction?.type ?? "buy");
  const [quantity, setQuantity] = useState(
    transaction ? formatQuantity(transaction.quantity) : ""
  );
  const [unit, setUnit] = useState<"chi" | "damlung">(transaction?.unit ?? "chi");
  // Edit mode seeds the field with total = pricePerUnit × quantity, the
  // inverse of what happens on submit.
  const [totalPaid, setTotalPaid] = useState(
    transaction
      ? new Decimal(transaction.pricePerUnit).times(transaction.quantity).toString()
      : ""
  );
  const [currency, setCurrency] = useState<"USD" | "KHR">(transaction?.currency ?? "USD");
  const [transactionDate, setTransactionDate] = useState(
    transaction?.transactionDate ?? toDateKey(new Date())
  );
  const [notes, setNotes] = useState(transaction?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  function touch(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  const derivedPricePerUnit = derivePricePerUnit(totalPaid, quantity);

  const payload = {
    type,
    quantity,
    unit,
    pricePerUnit: derivedPricePerUnit,
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

  const spotPerUnit = priceFromTroyOz(currentPricePerTroyOz, unit);

  // Fat-finger guard: compare the derived per-unit price against the
  // current spot rate for the selected unit. KHR rows skip it — the rest
  // of the app treats non-USD prices as un-comparable to the USD spot.
  const priceVerdict =
    currency === "USD" && derivedPricePerUnit !== ""
      ? classifyPrice(Number(derivedPricePerUnit), Number(spotPerUnit))
      : "ok";
  const priceIsHard = isHardVerdict(priceVerdict);
  const priceIsSoft = isSoftVerdict(priceVerdict);
  const priceVerdictMessage =
    priceVerdict === "hard-low"
      ? t.dialog.priceHardLow
      : priceVerdict === "hard-high"
        ? t.dialog.priceHardHigh
        : priceVerdict === "soft-low"
          ? t.dialog.priceSoftLow
          : priceVerdict === "soft-high"
            ? t.dialog.priceSoftHigh
            : null;

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

    if (!parsed.success) {
      notify.error(t.dialog.toast.checkFields);
      return;
    }

    // A price wildly off spot (an extra zero, a wrong unit) blocks the
    // save; the inline message below the summary box explains why.
    if (priceIsHard) {
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
        pricePerUnit: derivedPricePerUnit,
        currency,
        transactionDate,
        notes: notes || null,
      });
    }

    let res: Response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any;
    try {
      res = await fetch(
        isEdit ? `/api/transactions/${transaction.id}` : "/api/transactions",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      body = await res.json();
    } catch {
      setSubmitting(false);
      const message = t.dialog.toast.network;
      if (isOptimistic) {
        onAddSettled!(tempId!, { ok: false, message });
      }
      notify.error(message);
      return;
    }

    setSubmitting(false);

    if (!res.ok || "error" in body) {
      const code: string | undefined = body?.error?.code;
      const message =
        code === "RATE_LIMITED"
          ? t.dialog.toast.rateLimited
          : code === "UNAUTHORIZED"
            ? t.dialog.toast.sessionExpired
            : code === "INVALID_INPUT"
              ? t.dialog.toast.invalidInput
              : t.dialog.toast.serverError;
      if (isOptimistic) {
        onAddSettled!(tempId!, { ok: false, message });
      }
      notify.error(message);
      return;
    }

    if (isOptimistic) {
      onAddSettled!(tempId!, { ok: true });
    }
    if (isEdit) {
      notify.success(t.dialog.toast.updated);
      onEditSuccess?.();
    } else {
      const qty = formatQuantity(quantity);
      notify.success(
        type === "buy"
          ? t.dialog.toast.buyAdded(qty, unitLabel(unit))
          : t.dialog.toast.sellRecorded(qty, unitLabel(unit))
      );
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-100">
        {submitting ? (
          <LoadingScreen
            label={isEdit ? t.dialog.savingChanges : t.dialog.savingTransaction}
            className="min-h-56"
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isEdit ? t.dialog.editTitle : t.dialog.addTitle}</DialogTitle>
              <DialogDescription>
                {isEdit ? t.dialog.editDescription : t.dialog.addDescription}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid gap-7 pt-2">
              <div className="grid grid-cols-2 gap-2.5">
                {(["buy", "sell"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={cn(
                      "tt-label border py-2.5 text-[12px] transition-colors",
                      type === option
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {typeLabel(option)}
                  </button>
                ))}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">{t.dialog.quantity}</Label>
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
                      <SelectValue>
                        {(value: "chi" | "damlung") => unitLabel(value)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chi">{t.unit.chi}</SelectItem>
                      <SelectItem value="damlung">{t.unit.damlung}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {fieldError("quantity") && (
                  <p className="text-[11.5px] text-destructive">{fieldError("quantity")}</p>
                )}
                {exceedsHoldings && (
                  <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-[12px] text-muted-foreground">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      {t.dialog.exceedsHoldings(
                        formatQuantity(fromTroyOz(holdingsExcludingSelf.totalTroyOz, unit)),
                        unitLabel(unit)
                      )}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pricePerUnit">{t.dialog.totalPaid}</Label>
                <div className="flex gap-2">
                  <Input
                    id="pricePerUnit"
                    name="pricePerUnit"
                    type="number"
                    step="any"
                    min="0"
                    value={totalPaid}
                    onChange={(e) => setTotalPaid(e.target.value)}
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

              <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className="tt-label text-[10.5px] text-muted-foreground">
                    {t.dialog.perUnitEquiv(unitLabel(unit).toLowerCase())}
                  </span>
                  <span className="font-mono tabular-nums text-foreground">
                    {derivedPricePerUnit === ""
                      ? "—"
                      : currency === "USD"
                        ? formatUsd(derivedPricePerUnit)
                        : `${new Intl.NumberFormat("en-US").format(Number(derivedPricePerUnit))} KHR`}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="tt-label text-[10.5px] text-muted-foreground">{t.dialog.currentSpot}</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {formatUsd(spotPerUnit)}/{unitLabel(unit).toLowerCase()}
                  </span>
                </div>
              </div>

              {priceVerdictMessage && priceIsHard && (
                <p className="text-[11.5px] text-destructive">{priceVerdictMessage}</p>
              )}
              {priceVerdictMessage && priceIsSoft && (
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-[12px] text-muted-foreground">
                  <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{priceVerdictMessage}</span>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="transactionDate">{t.dialog.date}</Label>
                <DateField
                  name="transactionDate"
                  value={transactionDate}
                  onChange={setTransactionDate}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-muted-foreground">
                  {t.dialog.notes}
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

              <Button
                type="submit"
                disabled={submitting || priceIsHard}
                className="w-full"
              >
                {t.dialog.saveTransaction}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
