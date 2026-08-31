"use client";

import { useMemo, useState } from "react";
import type { Holdings } from "@/lib/calc/holdings";
import { computeWhatIf } from "@/lib/calc/whatIf";
import type { GoldUnit } from "@/lib/calc/units";
import { formatQuantity, formatUsd } from "@/lib/format/money";
import { useLocale } from "@/lib/i18n/locale-context";
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
}

// Stateless what-if: fold a hypothetical buy into the current position
// and show the blended average cost, new totals, and break-even spot
// (dashboard-expansion-plan.md §5.4). No persistence, no API — the calc
// lives in lib/calc/whatIf.ts.
export function WhatIf({ holdings }: WhatIfProps) {
  const { t } = useLocale();
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<GoldUnit>("damlung");
  const [totalPrice, setTotalPrice] = useState("");

  const ready = Number(quantity) > 0 && Number(totalPrice) > 0;

  const result = useMemo(
    () =>
      ready
        ? computeWhatIf(holdings, {
            quantity,
            unit,
            totalPriceUsd: totalPrice,
          })
        : null,
    [ready, holdings, quantity, unit, totalPrice],
  );

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[13px] text-muted-foreground">
        {t.insights.whatIfDescription}
      </p>

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
          <Label htmlFor="whatif-total">{t.insights.whatIfTotalPrice}</Label>
          <Input
            id="whatif-total"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
          />
        </div>
      </div>

      {result === null ? (
        <p className="text-[13px] text-muted-foreground">
          {t.insights.whatIfEmpty}
        </p>
      ) : (
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="tt-label text-[10.5px] text-muted-foreground">
              {t.insights.newAvgCost}
            </dt>
            <dd>
              <MonoValue>
                {formatUsd(result.newAverageCostPerDamlung)}
              </MonoValue>{" "}
              <span className="text-[11px] text-muted-foreground">
                {t.insights.perDamlung}
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="tt-label text-[10.5px] text-muted-foreground">
              {t.insights.newHoldings}
            </dt>
            <dd>
              <MonoValue>
                {formatQuantity(result.newHoldingsDamlung)} {t.unit.damlung}
              </MonoValue>{" "}
              <span className="text-[11px] text-muted-foreground">
                ({formatQuantity(result.newHoldingsChi)} {t.unit.chi})
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="tt-label text-[10.5px] text-muted-foreground">
              {t.insights.breakEven}
            </dt>
            <dd>
              <MonoValue>
                {formatUsd(result.breakEvenSpotPerDamlung)}
              </MonoValue>{" "}
              <span className="text-[11px] text-muted-foreground">
                {t.insights.perDamlung}
              </span>
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
