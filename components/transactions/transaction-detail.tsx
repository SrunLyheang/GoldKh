"use client";

import { computeRowValuation } from "@/lib/calc/transactionRow";
import { classifyEntry } from "@/lib/calc/ledgerEntry";
import type { GoldUnit } from "@/lib/calc/units";
import { formatUsd } from "@/lib/format/money";
import { useLocale } from "@/lib/i18n/locale-context";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { MonoValue } from "@/components/dashboard/mono-value";
import type { TransactionRow } from "@/components/dashboard/transaction-history";

// A date-only string ("2026-08-01") rendered as "1 Aug 2026", pinned to
// UTC so it never shifts a day under the viewer's zone.
function formatFullDate(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="tt-label text-[10px] text-muted-foreground">{label}</p>
      <div className="mt-1 text-[12.5px] text-foreground">{children}</div>
    </div>
  );
}

// The everything-the-compact-view-omits panel shown when a transaction
// row / card is expanded (dashboard-expansion-plan.md §4.2). Shared by the
// dashboard panel and the full transactions route so the two can't drift.
// `spotPerDamlungOnDate` is resolved by the caller from its own snapshot
// list — null means the price history doesn't reach that far back.
export function TransactionDetail({
  row,
  currentPricePerTroyOz,
  displayUnit,
  spotPerDamlungOnDate,
}: {
  row: TransactionRow;
  currentPricePerTroyOz: string;
  displayUnit: GoldUnit;
  spotPerDamlungOnDate: number | null;
}) {
  const { t } = useLocale();
  const kind = classifyEntry(row);
  const valuation = computeRowValuation(row, currentPricePerTroyOz);
  const unit = unitLabels(t, displayUnit).primaryLower;
  const pricePerDisplayUnit =
    displayUnit === "chi" ? valuation.pricePerChi : valuation.pricePerDamlung;

  const spotOnDate =
    spotPerDamlungOnDate === null
      ? "—"
      : formatUsd(
          String(
            displayUnit === "chi"
              ? spotPerDamlungOnDate / 10
              : spotPerDamlungOnDate
          )
        );

  const isGain =
    valuation.pnlUsd !== null && Number(valuation.pnlUsd) >= 0;

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-(--glass-border-to) bg-(--glass-bg) px-4 py-3.5 sm:grid-cols-3">
      <Field label={t.transactions.date}>{formatFullDate(row.transactionDate)}</Field>
      <Field label={`${t.dialog.perUnitEquiv(unit)}`}>
        <MonoValue className="text-[12.5px]">
          {formatUsd(pricePerDisplayUnit)}
        </MonoValue>
      </Field>
      <Field label={`${t.insights.spotOnDate} (/${unit})`}>
        <MonoValue tone="muted" className="text-[12.5px]">
          {spotOnDate}
        </MonoValue>
      </Field>

      {kind === "open-buy" && (
        <>
          <Field label="Cost basis">
            <MonoValue className="text-[12.5px]">
              {formatUsd(valuation.amountUsd ?? "0")}
            </MonoValue>
          </Field>
          <Field label={t.transactions.currentValue}>
            <MonoValue className="text-[12.5px]">
              {valuation.currentValueUsd
                ? formatUsd(valuation.currentValueUsd)
                : "—"}
            </MonoValue>
          </Field>
          <Field label={t.transactions.pnl}>
            {valuation.pnlUsd ? (
              <MonoValue signed tone={isGain ? "gain" : "loss"} className="text-[12.5px]">
                {formatUsd(valuation.pnlUsd)}
              </MonoValue>
            ) : (
              "—"
            )}
          </Field>
        </>
      )}

      {kind === "sale" && (
        <Field label="Proceeds">
          <MonoValue className="text-[12.5px]">
            {formatUsd(valuation.amountUsd ?? "0")}
          </MonoValue>
        </Field>
      )}

      {kind === "non-usd" && (
        <Field label={t.transactions.pnl}>
          <span className="text-muted-foreground">{t.transactions.khrNote}</span>
        </Field>
      )}

      <Field label="Notes">
        <span className={row.notes ? "" : "text-muted-foreground"}>
          {row.notes ? row.notes : "—"}
        </span>
      </Field>
    </div>
  );
}
