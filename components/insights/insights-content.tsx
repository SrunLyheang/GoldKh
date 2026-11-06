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
// hands each section its slice, laid out as notebook pages.
export function InsightsContent({
  transactions,
  snapshots,
  pricePerTroyOz,
}: InsightsContentProps) {

  // Sections glide in on scroll-into-view, staggered — the same quiet
  // entrance the main dashboard uses. Hooks run unconditionally; the
  // wrappers below attach ref + class + delay.
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

  // Two rows of pages with different weights: what the notebook says
  // (figures down the margin, value over time beside them), then each
  // buy against the price of its day beside a what-if scratch pad.
  return (
    <div className="dash-enter flex flex-col gap-6 md:gap-8">
      <section className="page page--plain grid gap-x-10 gap-y-6 px-5 py-6 sm:px-10 sm:py-8 lg:grid-cols-[17rem_1fr]">
        <div>
          <h1 className="tt-heading text-figure-lg text-foreground">
            {t.insights.title}
          </h1>
          <p className="mt-1 text-detail text-muted-foreground">
            {t.insights.subtitle}
          </p>
          <h2 className="sr-only">{t.insights.readoutsTitle}</h2>
          <div className="mt-4">
            <Readouts
              holdings={holdings}
              gainLoss={gainLoss}
              realized={realized}
              aggregates={aggregates}
              pricePerTroyOz={pricePerTroyOz}
            />
          </div>
        </div>
        <div className="min-w-0">
          <h2 className="tt-heading text-figure text-foreground">
            {t.insights.valueOverTimeTitle}
          </h2>
          <p className="mb-3 mt-0.5 text-label text-faint">
            {t.insights.valueOverTimeCaption}
          </p>
          <ValueOverTime points={portfolioSeries} />
        </div>
      </section>

      <div className="grid gap-6 md:gap-8 xl:grid-cols-2">
        <section className="page page--plain min-w-0 px-5 py-6 sm:px-10 sm:py-8">
          <h2 className="tt-heading text-figure text-foreground">
            {t.insights.buyHistoryTitle}
          </h2>
          <p className="mb-4 mt-0.5 text-label text-faint">
            {t.insights.buyHistoryCaption}
          </p>
          <BuyHistory rows={buyQuality} />
        </section>
        <section className="page px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="tt-heading text-figure text-foreground">
            {t.insights.whatIfTitle}
          </h2>
          <WhatIf holdings={holdings} pricePerTroyOz={pricePerTroyOz} />
        </section>
      </div>
    </div>
  );
}
