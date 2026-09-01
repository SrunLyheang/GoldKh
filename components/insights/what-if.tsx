"use client";

import { useMemo, useState } from "react";
import Decimal from "decimal.js";
import type { Holdings } from "@/lib/calc/holdings";
import {
  computeWhatIf,
  spotImpliedTotal,
  type WhatIfMode,
  type WhatIfResult,
} from "@/lib/calc/whatIf";
import { fromTroyOz, type GoldUnit } from "@/lib/calc/units";
import {
  formatPercent,
  formatQuantity,
  formatUsd,
} from "@/lib/format/money";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonoValue } from "@/components/dashboard/mono-value";

interface WhatIfProps {
  holdings: Holdings;
  pricePerTroyOz: string;
}

const MODES: WhatIfMode[] = ["buy", "sell"];

// Stateless what-if: fold a hypothetical buy or sell into the current
// position and show the projected average cost, holdings, break-even,
// realized/unrealized P&L — each as a current → projected pair
// (dashboard-expansion-plan.md §5.4). No persistence, no API — the calc
// lives in lib/calc/whatIf.ts.
export function WhatIf({ holdings, pricePerTroyOz }: WhatIfProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<WhatIfMode>("buy");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<GoldUnit>("damlung");
  const [totalPrice, setTotalPrice] = useState("");

  const ready = Number(quantity) > 0 && Number(totalPrice) > 0;

  const impliedTotal = useMemo(
    () => spotImpliedTotal(quantity, unit, pricePerTroyOz),
    [quantity, unit, pricePerTroyOz],
  );
  const hasImplied = Number(impliedTotal) > 0;

  const result = useMemo(
    () =>
      ready
        ? computeWhatIf(holdings, {
            mode,
            quantity,
            unit,
            totalPriceUsd: totalPrice,
            currentPricePerTroyOz: pricePerTroyOz,
          })
        : null,
    [ready, holdings, mode, quantity, unit, totalPrice, pricePerTroyOz],
  );

  const vsSpotPercent = useMemo(() => {
    if (!ready || !hasImplied) return null;
    return new Decimal(totalPrice)
      .minus(impliedTotal)
      .div(impliedTotal)
      .times(100)
      .toString();
  }, [ready, hasImplied, totalPrice, impliedTotal]);

  function useSpot() {
    if (!hasImplied) return;
    setTotalPrice(new Decimal(impliedTotal).toDecimalPlaces(2).toString());
  }

  const heldDamlung = fromTroyOz(holdings.totalTroyOz, "damlung");

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] text-muted-foreground">
        {t.insights.whatIfDescription}
      </p>

      <div
        role="tablist"
        aria-label={t.insights.whatIfTitle}
        className="inline-flex w-fit shrink-0 items-center gap-0.5 rounded-lg border border-(--glass-border-to) bg-(--glass-bg) p-0.5"
      >
        {MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={cn(
              "tt-label rounded-md px-2.5 py-1 text-[10.5px] transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "buy" ? t.insights.whatIfModeBuy : t.insights.whatIfModeSell}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="whatif-quantity">{t.insights.whatIfQuantity}</Label>
          <div className="flex gap-2">
            <Input
              id="whatif-quantity"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1"
            />
            <Select
              value={unit}
              onValueChange={(value) => setUnit(value as GoldUnit)}
            >
              <SelectTrigger id="whatif-unit" className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chi">{t.unit.chi}</SelectItem>
                <SelectItem value="damlung">{t.unit.damlung}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="whatif-total">{t.insights.whatIfTotalPrice}</Label>
            {hasImplied ? (
              <button
                type="button"
                onClick={useSpot}
                className="tt-label text-[10.5px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t.insights.whatIfUseSpot}
              </button>
            ) : null}
          </div>
          <Input
            id="whatif-total"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            placeholder={
              hasImplied
                ? formatUsd(
                    new Decimal(impliedTotal).toDecimalPlaces(2).toString(),
                  )
                : undefined
            }
          />
          {vsSpotPercent !== null ? (
            <span className="text-[11px]">
              <MonoValue
                tone={vsSpotToneFor(mode, vsSpotPercent)}
                className="text-[11px]"
              >
                {t.insights.whatIfVsSpot(formatPercent(vsSpotPercent))}
              </MonoValue>
            </span>
          ) : hasImplied ? (
            <span className="text-[11px] text-muted-foreground">
              {t.insights.whatIfSpotHint(
                formatUsd(
                  new Decimal(impliedTotal).toDecimalPlaces(2).toString(),
                ),
              )}
            </span>
          ) : null}
        </div>
      </div>

      {result === null ? (
        <p className="text-[13px] text-muted-foreground">
          {t.insights.whatIfEmpty}
        </p>
      ) : result.overSell ? (
        <p className="text-[13px] text-destructive">
          {t.insights.whatIfOverSell(
            `${formatQuantity(heldDamlung)} ${t.unit.damlung}`,
          )}
        </p>
      ) : (
        <WhatIfOutput t={t} result={result} />
      )}
    </div>
  );
}

type Dict = ReturnType<typeof useLocale>["t"];

function vsSpotToneFor(mode: WhatIfMode, percent: string) {
  const n = Number(percent);
  // Paying above spot on a buy — or selling below spot — is the bad side.
  const favourable = mode === "buy" ? n <= 0 : n >= 0;
  return favourable ? ("gain" as const) : ("loss" as const);
}

// A larger number is the favourable side: holdings, proceeds, P&L.
function toneForSign(value: string) {
  return Number(value) >= 0 ? ("gain" as const) : ("loss" as const);
}

// A smaller number is the favourable side: average cost and break-even
// (a position you break even on at a lower spot is the better one).
function costDeltaTone(value: string) {
  const n = Number(value);
  if (n === 0) return "muted" as const;
  return n < 0 ? ("gain" as const) : ("loss" as const);
}

function signedUsd(value: string) {
  const n = Number(value);
  return `${n >= 0 ? "+" : "-"}${formatUsd(Math.abs(n).toString())}`;
}

function signedQuantity(value: string, unitLabel: string) {
  const n = Number(value);
  return `${n >= 0 ? "+" : "−"}${formatQuantity(Math.abs(n).toString())} ${unitLabel}`;
}

function pnlText(usd: string, percent: string) {
  return `${formatUsd(usd)} (${formatPercent(percent)})`;
}

function holdingsText(damlung: string, chi: string, t: Dict) {
  return `${formatQuantity(damlung)} ${t.unit.damlung} (${formatQuantity(chi)} ${t.unit.chi})`;
}

interface CompareRow {
  kind: "compare";
  label: string;
  before: string;
  after: string;
  delta: string;
  deltaTone: "gain" | "loss" | "muted";
}

interface SingleRow {
  kind: "single";
  label: string;
  value: string;
  valueTone: "gain" | "loss" | "foreground";
}

function buildRows(result: WhatIfResult, t: Dict): (CompareRow | SingleRow)[] {
  const damlung = t.unit.damlung;
  const damlungSuffix = ` / ${t.unit.damlung.toLowerCase()}`;

  const pnlRow: CompareRow = {
    kind: "compare",
    label: t.insights.whatIfPnlAtSpot,
    before: pnlText(
      result.unrealizedUsd.before,
      result.unrealizedPercent.before,
    ),
    after: pnlText(result.unrealizedUsd.after, result.unrealizedPercent.after),
    delta: signedUsd(result.unrealizedUsd.delta),
    deltaTone: toneForSign(result.unrealizedUsd.delta),
  };

  if (result.mode === "buy") {
    return [
      {
        kind: "compare",
        label: t.insights.newHoldings,
        before: holdingsText(
          result.holdingsDamlung.before,
          result.holdingsChi.before,
          t,
        ),
        after: holdingsText(
          result.holdingsDamlung.after,
          result.holdingsChi.after,
          t,
        ),
        delta: signedQuantity(result.holdingsDamlung.delta, damlung),
        deltaTone: "gain",
      },
      pnlRow,
      {
        kind: "compare",
        label: t.insights.breakEven + damlungSuffix,
        before: formatUsd(result.breakEvenSpotPerDamlung.before),
        after: formatUsd(result.breakEvenSpotPerDamlung.after),
        delta: signedUsd(result.breakEvenSpotPerDamlung.delta),
        deltaTone: costDeltaTone(result.breakEvenSpotPerDamlung.delta),
      },
    ];
  }

  return [
    {
      kind: "single",
      label: t.insights.whatIfProceeds,
      value: formatUsd(result.proceedsUsd),
      valueTone: "foreground",
    },
    {
      kind: "single",
      label: t.insights.whatIfRealized,
      value: `${signedUsd(result.realizedUsd)} (${formatPercent(result.realizedPercent)})`,
      valueTone: toneForSign(result.realizedUsd),
    },
    {
      kind: "compare",
      label: t.insights.remainingHoldings,
      before: holdingsText(
        result.holdingsDamlung.before,
        result.holdingsChi.before,
        t,
      ),
      after: holdingsText(
        result.holdingsDamlung.after,
        result.holdingsChi.after,
        t,
      ),
      delta: signedQuantity(result.holdingsDamlung.delta, damlung),
      deltaTone: "loss",
    },
    pnlRow,
  ];
}

function WhatIfOutput({ t, result }: { t: Dict; result: WhatIfResult }) {
  const rows = buildRows(result, t);

  return (
    <dl className="flex flex-col divide-y divide-(--glass-border-to) border-t border-(--glass-border-to)">
      <div className="hidden gap-3 pt-3 pb-1 sm:grid sm:grid-cols-[minmax(9rem,1fr)_repeat(3,minmax(0,1fr))]">
        <span />
        <span className="tt-label text-[9.5px] text-muted-foreground">
          {t.insights.whatIfNow}
        </span>
        <span className="tt-label text-[9.5px] text-muted-foreground">
          {t.insights.whatIfAfter}
        </span>
        <span className="tt-label text-[9.5px] text-muted-foreground">
          {t.insights.whatIfChange}
        </span>
      </div>
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid gap-1 py-3 sm:grid-cols-[minmax(9rem,1fr)_repeat(3,minmax(0,1fr))] sm:items-baseline sm:gap-3"
        >
          <dt className="tt-label text-[10.5px] text-muted-foreground">
            {row.label}
          </dt>
          {row.kind === "single" ? (
            <dd className="sm:col-span-3">
              <MonoValue tone={row.valueTone}>{row.value}</MonoValue>
            </dd>
          ) : (
            <>
              <dd className="flex flex-col">
                <span className="tt-label text-[9.5px] text-muted-foreground sm:hidden">
                  {t.insights.whatIfNow}
                </span>
                <MonoValue tone="muted" className="text-[13px]">
                  {row.before}
                </MonoValue>
              </dd>
              <dd className="flex flex-col">
                <span className="tt-label text-[9.5px] text-muted-foreground sm:hidden">
                  {t.insights.whatIfAfter}
                </span>
                <MonoValue className="text-[13px]">{row.after}</MonoValue>
              </dd>
              <dd className="flex flex-col">
                <span className="tt-label text-[9.5px] text-muted-foreground sm:hidden">
                  {t.insights.whatIfChange}
                </span>
                <MonoValue
                  tone={row.deltaTone === "muted" ? "muted" : row.deltaTone}
                  className="text-[13px]"
                >
                  {row.delta}
                </MonoValue>
              </dd>
            </>
          )}
        </div>
      ))}
    </dl>
  );
}
