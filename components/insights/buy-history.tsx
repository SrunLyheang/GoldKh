"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BuyQualityRow } from "@/lib/calc/buyQuality";
import { formatPercent, formatQuantity, formatUsd } from "@/lib/format/money";
import { t } from "@/lib/i18n/dictionary";
import { unitLabels } from "@/lib/i18n/unit-labels";
import { cn } from "@/lib/utils";
import { MonoValue } from "@/components/dashboard/mono-value";

interface BuyHistoryProps {
  rows: BuyQualityRow[];
}

type SortKey = "date" | "vsSpot";

// A sort header in the glass idiom — a rotating chevron that shows only
// on the active key (matches the transactions route's SortHeader).
function SortButton({
  label,
  active,
  ascending,
  onClick,
}: {
  label: string;
  active: boolean;
  ascending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "tt-label inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
      {active && (
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", ascending && "rotate-180")}
        />
      )}
    </button>
  );
}

// Every buy graded against spot on its date (dashboard-expansion-plan.md
// §5.3). Sortable by date or by `vs spot`; rows with no old-enough
// snapshot show "—" and sort last on the vs-spot key.
export function BuyHistory({ rows }: BuyHistoryProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [desc, setDesc] = useState(true);

  const sorted = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortKey === "date") {
        cmp = a.transactionDate.localeCompare(b.transactionDate);
      } else {
        const av = a.vsSpotPercent;
        const bv = b.vsSpotPercent;
        if (av === null && bv === null) cmp = 0;
        else if (av === null) return 1; // nulls always last
        else if (bv === null) return -1;
        else cmp = Number(av) - Number(bv);
      }
      return desc ? -cmp : cmp;
    });
    return copy;
  }, [rows, sortKey, desc]);

  if (rows.length === 0) {
    return (
      <p className="text-[13.5px] text-muted-foreground">{t.insights.noBuys}</p>
    );
  }

  function toggle(key: SortKey) {
    if (key === sortKey) {
      setDesc((d) => !d);
    } else {
      setSortKey(key);
      setDesc(true);
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-(--glass-border-to)">
      <table className="w-full border-collapse text-[13px]">
        <thead className="glass-chrome sticky top-0 z-10">
          <tr className="tt-label border-b border-(--glass-border-to) text-left text-[11px] text-muted-foreground">
            <th className="py-2 pr-3 pl-3 font-normal">
              <SortButton
                label={t.insights.sortDate}
                active={sortKey === "date"}
                ascending={!desc}
                onClick={() => toggle("date")}
              />
            </th>
            <th className="py-2 pr-3 font-normal">{t.insights.quantity}</th>
            <th className="py-2 pr-3 text-right font-normal">
              {t.insights.paid}
            </th>
            <th className="py-2 pr-3 text-right font-normal">
              {t.insights.spotOnDate}
            </th>
            <th className="py-2 pr-3 text-right font-normal">
              <SortButton
                label={t.insights.sortVsSpot}
                active={sortKey === "vsSpot"}
                ascending={!desc}
                onClick={() => toggle("vsSpot")}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => {
            const { primary: unitLabel } = unitLabels(t, row.unit);
            const vs =
              row.vsSpotPercent === null ? null : Number(row.vsSpotPercent);
            return (
              <tr
                key={`${row.transactionDate}-${i}`}
                className="border-b border-(--glass-border-to) last:border-0"
              >
                <td className="py-2.5 pr-3 pl-3 font-mono tabular-nums text-muted-foreground">
                  {row.transactionDate}
                </td>
                <td className="py-2.5 pr-3">
                  <MonoValue>
                    {formatQuantity(row.quantity)} {unitLabel}
                  </MonoValue>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <MonoValue>{formatUsd(row.paidUsd)}</MonoValue>
                </td>
                <td className="py-2.5 pr-3 text-right">
                  {row.spotPerUnitUsd === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <MonoValue tone="muted">
                      {formatUsd(row.spotPerUnitUsd)}
                    </MonoValue>
                  )}
                </td>
                <td className={cn("py-2.5 pr-3 text-right")}>
                  {vs === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <MonoValue tone={vs >= 0 ? "gain" : "loss"} signed>
                      {formatPercent(row.vsSpotPercent as string)}
                    </MonoValue>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
