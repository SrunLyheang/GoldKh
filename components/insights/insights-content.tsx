"use client";

import { useMemo } from "react";
import { computeGainLoss } from "@/lib/calc/gainLoss";
import { computeHoldings } from "@/lib/calc/holdings";
import { computeRealized } from "@/lib/calc/realized";
import { computeInsights } from "@/lib/calc/insights";
import { computeBuyQuality } from "@/lib/calc/buyQuality";
import { toChronological } from "@/lib/calc/chronological";
import {
  buildPortfolioSeries,
  type DatedLedgerEntry,
  type PriceSnapshotPoint,
} from "@/lib/calc/portfolioSeries";
import { useLocale } from "@/lib/i18n/locale-context";
import { useSectionEnter } from "@/components/motion/use-section-enter";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/dashboard/panel";
import { Readouts } from "./readouts";
import { ValueOverTime } from "./value-over-time";
import { BuyHistory } from "./buy-history";
import { WhatIf } from "./what-if";

interface InsightsContentProps {
  transactions: DatedLedgerEntry[];
  snapshots: PriceSnapshotPoint[];
  pricePerTroyOz: string;
}

// Client shell for the Insights route: runs every pure calc once and
// hands each section its slice. All four sections are a Panel size="lg"
// in the dashboard's 32px block rhythm with a .tt-heading .tt-bracket
// header (dashboard-expansion-plan.md §5).
export function InsightsContent({
  transactions,
  snapshots,
  pricePerTroyOz,
}: InsightsContentProps) {
  const { t } = useLocale();

  // Sections glide in on scroll-into-view, staggered — the same quiet
  // entrance the main dashboard uses. Hooks run unconditionally; the
  // wrappers below attach ref + class + delay.
  const { ref: titleRef, revealClass: titleCls, style: titleStyle } =
    useSectionEnter<HTMLHeadingElement>(0);
  const { ref: readoutsRef, revealClass: readoutsCls, style: readoutsStyle } =
    useSectionEnter<HTMLDivElement>(60);
  const { ref: valueRef, revealClass: valueCls, style: valueStyle } =
    useSectionEnter<HTMLDivElement>(120);
  const { ref: buyHistoryRef, revealClass: buyHistoryCls, style: buyHistoryStyle } =
    useSectionEnter<HTMLDivElement>(160);
  const { ref: whatIfRef, revealClass: whatIfCls, style: whatIfStyle } =
    useSectionEnter<HTMLDivElement>(200);

  // Newest-first from the server; the replay-based aggregates below need
  // it oldest-first (see toChronological).
  const chronological = useMemo(
    () => toChronological(transactions),
    [transactions],
  );

  const holdings = useMemo(
    () => computeHoldings(chronological),
    [chronological],
  );
  const gainLoss = useMemo(
    () =>
      computeGainLoss(
        holdings.totalTroyOz,
        holdings.averageCostPerTroyOz,
        pricePerTroyOz,
      ),
    [holdings, pricePerTroyOz],
  );
  const realized = useMemo(
    () => computeRealized(chronological),
    [chronological],
  );
  const aggregates = useMemo(
    () => computeInsights(transactions),
    [transactions],
  );
  const portfolioSeries = useMemo(
    () => buildPortfolioSeries(transactions, snapshots),
    [transactions, snapshots],
  );
  const buyQuality = useMemo(
    () => computeBuyQuality(transactions, snapshots),
    [transactions, snapshots],
  );

  return (
    <div className="flex flex-col gap-8">
      <h1
        ref={titleRef}
        style={titleStyle}
        className={cn(
          "tt-heading tt-bracket text-[15px] text-foreground",
          titleCls,
        )}
      >
        {t.insights.title}
      </h1>

      <div ref={readoutsRef} style={readoutsStyle} className={readoutsCls}>
        <Panel size="lg">
          <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
            {t.insights.readoutsTitle}
          </h2>
          <Readouts
            holdings={holdings}
            gainLoss={gainLoss}
            realized={realized}
            aggregates={aggregates}
            pricePerTroyOz={pricePerTroyOz}
          />
        </Panel>
      </div>

      <div ref={valueRef} style={valueStyle} className={valueCls}>
        <Panel size="lg">
          <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
            {t.insights.valueOverTimeTitle}
          </h2>
          <ValueOverTime points={portfolioSeries} />
        </Panel>
      </div>

      <div
        ref={buyHistoryRef}
        style={buyHistoryStyle}
        className={buyHistoryCls}
      >
        <Panel size="lg">
          <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
            {t.insights.buyHistoryTitle}
          </h2>
          <BuyHistory rows={buyQuality} />
        </Panel>
      </div>

      <div ref={whatIfRef} style={whatIfStyle} className={whatIfCls}>
        <Panel size="lg">
          <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
            {t.insights.whatIfTitle}
          </h2>
          <WhatIf holdings={holdings} pricePerTroyOz={pricePerTroyOz} />
        </Panel>
      </div>
    </div>
  );
}
