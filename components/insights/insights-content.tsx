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
      <h1 className="tt-heading tt-bracket text-[15px] text-foreground">
        {t.insights.title}
      </h1>

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

      <Panel size="lg">
        <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
          {t.insights.valueOverTimeTitle}
        </h2>
        <ValueOverTime points={portfolioSeries} />
      </Panel>

      <Panel size="lg">
        <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
          {t.insights.buyHistoryTitle}
        </h2>
        <BuyHistory rows={buyQuality} />
      </Panel>

      <Panel size="lg">
        <h2 className="tt-heading tt-bracket mb-4 text-[15px] text-foreground">
          {t.insights.whatIfTitle}
        </h2>
        <WhatIf holdings={holdings} pricePerTroyOz={pricePerTroyOz} />
      </Panel>
    </div>
  );
}
