"use client";

import { useMemo } from "react";
import { computeInsights } from "@/lib/calc/insights";
import { computeBuyQuality } from "@/lib/calc/buyQuality";
import { computePosition } from "@/lib/calc/position";
import {
  buildPortfolioSeries,
  type DatedLedgerEntry,
  type PriceSnapshotPoint,
} from "@/lib/calc/portfolioSeries";
import { t } from "@/lib/i18n/dictionary";
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
// header.
export function InsightsContent({
  transactions,
  snapshots,
  pricePerTroyOz,
}: InsightsContentProps) {

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

  // Newest-first from the server; computePosition re-sorts oldest-first
  // before replaying the ledger.
  const { holdings, gainLoss, realized } = useMemo(
    () => computePosition(transactions, pricePerTroyOz),
    [transactions, pricePerTroyOz],
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
