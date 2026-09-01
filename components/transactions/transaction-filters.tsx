"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { useLocale } from "@/lib/i18n/locale-context";
import type { Dictionary } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import type { FilterCriteria } from "@/lib/calc/filterTransactions";
import type { GoldUnit } from "@/lib/calc/units";

// The controlled shape the view keeps in state — every field a string so
// the inputs stay simple; `toCriteria` below narrows to FilterCriteria.
export interface FilterFormState {
  amountPaid: string;
  dateFrom: string;
  dateTo: string;
  quantity: string;
  quantityUnit: GoldUnit;
  direction: "all" | "buy" | "sell";
}

export const EMPTY_FILTERS: FilterFormState = {
  amountPaid: "",
  dateFrom: "",
  dateTo: "",
  quantity: "",
  quantityUnit: "chi",
  direction: "all",
};

// Keep only digits and a single decimal point — the amount / quantity
// fields are `type="text"` (a native number spinner fights decimal entry
// and scroll-wheel edits), so the guard lives here.
function sanitizeDecimal(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  return parts.length <= 1 ? cleaned : `${parts[0]}.${parts.slice(1).join("")}`;
}

export function toCriteria(form: FilterFormState): FilterCriteria {
  const criteria: FilterCriteria = {};
  const amount = Number(form.amountPaid);
  if (form.amountPaid.trim() !== "" && Number.isFinite(amount) && amount > 0) {
    criteria.amountPaid = amount;
  }
  if (form.dateFrom) criteria.dateFrom = form.dateFrom;
  if (form.dateTo) criteria.dateTo = form.dateTo;
  const qty = Number(form.quantity);
  if (form.quantity.trim() !== "" && Number.isFinite(qty) && qty > 0) {
    criteria.quantity = qty;
    criteria.quantityUnit = form.quantityUnit;
  }
  if (form.direction !== "all") criteria.direction = form.direction;
  return criteria;
}

export function activeFilterCount(form: FilterFormState): number {
  let n = 0;
  if (form.amountPaid.trim() !== "") n += 1;
  if (form.dateFrom || form.dateTo) n += 1;
  if (form.quantity.trim() !== "") n += 1;
  if (form.direction !== "all") n += 1;
  return n;
}

// One removable summary of each active filter, for the collapsed bar.
function activeChips(
  form: FilterFormState,
  t: Dictionary
): { key: string; label: string; clear: Partial<FilterFormState> }[] {
  const chips: { key: string; label: string; clear: Partial<FilterFormState> }[] =
    [];
  if (form.amountPaid.trim() !== "") {
    chips.push({
      key: "amount",
      label: `$${form.amountPaid} ${t.filters.amountTolerance}`,
      clear: { amountPaid: "" },
    });
  }
  if (form.dateFrom || form.dateTo) {
    const label = form.dateFrom && form.dateTo
      ? `${form.dateFrom} → ${form.dateTo}`
      : form.dateFrom
        ? `${t.filters.dateFrom} ${form.dateFrom}`
        : `${t.filters.dateTo} ${form.dateTo}`;
    chips.push({ key: "date", label, clear: { dateFrom: "", dateTo: "" } });
  }
  if (form.quantity.trim() !== "") {
    chips.push({
      key: "qty",
      label: `${form.quantity} ${form.quantityUnit}`,
      clear: { quantity: "" },
    });
  }
  if (form.direction !== "all") {
    chips.push({
      key: "dir",
      label: form.direction === "buy" ? t.filters.buy : t.filters.sell,
      clear: { direction: "all" },
    });
  }
  return chips;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="tt-label mb-1 block text-[9.5px] text-muted-foreground">
      {children}
    </span>
  );
}

function Fields({
  value,
  onChange,
}: {
  value: FilterFormState;
  onChange: (next: FilterFormState) => void;
}) {
  const { t } = useLocale();
  const set = (patch: Partial<FilterFormState>) =>
    onChange({ ...value, ...patch });

  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
      <label className="block">
        <FieldLabel>
          {t.filters.amountPaid}{" "}
          <span className="text-muted-foreground/70">
            {t.filters.amountTolerance}
          </span>
        </FieldLabel>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[13px] text-muted-foreground">
            $
          </span>
          <Input
            inputMode="decimal"
            placeholder="0"
            value={value.amountPaid}
            onChange={(e) =>
              set({ amountPaid: sanitizeDecimal(e.target.value) })
            }
            className="w-32 pl-5 font-mono tabular-nums"
          />
        </div>
      </label>

      <div>
        <FieldLabel>{t.filters.date}</FieldLabel>
        <div className="flex items-center gap-1.5">
          <Input
            aria-label={t.filters.dateFrom}
            type="date"
            value={value.dateFrom}
            onChange={(e) => set({ dateFrom: e.target.value })}
            className="w-35 min-w-0 font-mono"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            aria-label={t.filters.dateTo}
            type="date"
            value={value.dateTo}
            onChange={(e) => set({ dateTo: e.target.value })}
            className="w-35 min-w-0 font-mono"
          />
        </div>
      </div>

      <div>
        <FieldLabel>{t.filters.quantity}</FieldLabel>
        <div className="flex gap-1.5">
          <Input
            aria-label={t.filters.quantity}
            inputMode="decimal"
            placeholder="0"
            value={value.quantity}
            onChange={(e) => set({ quantity: sanitizeDecimal(e.target.value) })}
            className="w-20 font-mono tabular-nums"
          />
          <Select
            value={value.quantityUnit}
            onValueChange={(v) => set({ quantityUnit: v as GoldUnit })}
          >
            <SelectTrigger className="w-24" aria-label={t.filters.unit}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chi">{t.unit.chi}</SelectItem>
              <SelectItem value="damlung">{t.unit.damlung}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <FieldLabel>{t.filters.direction}</FieldLabel>
        <SegmentedControl
          ariaLabel={t.filters.direction}
          value={value.direction}
          onChange={(v) => set({ direction: v })}
          options={[
            { value: "all", label: t.filters.all },
            { value: "buy", label: t.filters.buy },
            { value: "sell", label: t.filters.sell },
          ]}
        />
      </div>
    </div>
  );
}

// Table-first filter bar: a single toggle row that stays out of the way
// until you need it. Collapsed, it shows the active filters as removable
// chips plus the result count; expanded, the full control set. Same
// behaviour on every viewport (dashboard-expansion-plan.md §4b, adjusted
// after user feedback that the always-open grid buried the table).
export function TransactionFilters({
  value,
  onChange,
  resultCount,
}: {
  value: FilterFormState;
  onChange: (next: FilterFormState) => void;
  resultCount: number;
}) {
  const { t } = useLocale();
  const count = activeFilterCount(value);
  const [open, setOpen] = useState(false);
  const chips = activeChips(value, t);

  return (
    <div className="border-b border-(--glass-border-to) pb-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={cn(
            "tt-label inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10.5px] transition-colors",
            count > 0 || open
              ? "border-primary/50 text-foreground"
              : "border-(--glass-border-to) text-muted-foreground hover:bg-(--glow-color) hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t.filters.toggle(count)}
        </button>

        {!open &&
          chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => onChange({ ...value, ...chip.clear })}
              className="tt-label inline-flex items-center gap-1 rounded-full border border-(--glass-border-to) bg-(--glow-color) py-1 pr-1 pl-2 text-[10px] text-foreground transition-[filter] hover:brightness-125"
            >
              {chip.label}
              <X className="h-3 w-3 text-muted-foreground" />
            </button>
          ))}

        {count > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="tt-label text-[10px] text-muted-foreground hover:text-foreground"
          >
            {t.filters.clear}
          </button>
        )}

        <span className="tt-label ml-auto text-[10.5px] text-muted-foreground">
          {t.filters.resultCount(resultCount)}
        </span>
      </div>

      {open && (
        <div className="mt-4">
          <Fields value={value} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
