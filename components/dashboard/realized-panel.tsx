"use client";

import { formatPercent, formatUsd } from "@/lib/format/money";
import { toneFromAmount } from "@/lib/format/tone";
import { useLocale } from "@/lib/i18n/locale-context";
import { COUNT_UP_MS, useCountUp } from "@/lib/ui/use-count-up";
import { MonoValue } from "./mono-value";
import { Panel } from "./panel";

interface RealizedPanelProps {
  realizedUsd: string;
  realizedPercent: string;
  saleCount: number;
}

// A full-width readout, shaped like the hero price card (lg elevation,
// left figure / right context, same mobile stack) so the dashboard opens
// and closes on two matching readouts: spot price at the top, realized
// result here. Rendered by DashboardContent only when saleCount > 0.
// See context/design-specs/current-issues-plan.md (Q6).
export function RealizedPanel({
  realizedUsd,
  realizedPercent,
  saleCount,
}: RealizedPanelProps) {
  const { t } = useLocale();
  // Exactly zero is "broke even" — no gain/loss colour.
  const isBreakEven = Number(realizedUsd) === 0;
  const tone = isBreakEven ? "foreground" : toneFromAmount(realizedUsd);

  // Rolls from zero to the realized figure on every page entry, the same
  // way the stat cards and hero price do — positive rolls up, negative
  // down. A later change (a new sale recomputes it) snaps. The percent
  // sub-line snaps; reduced-motion snaps everything. See
  // context/design-specs/03-dashboard-animation-and-input-feedback.md.
  const valueDisplay = useCountUp(Number(realizedUsd), {
    from: 0,
    durationMs: COUNT_UP_MS,
    format: (value) => formatUsd(String(value)),
  });

  return (
    <Panel size="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div>
          <p className="tt-label text-[11px] text-muted-foreground">
            <span className="tt-bracket">{t.realized.eyebrow}</span>{" "}
            {t.realized.fromSales(saleCount)}
          </p>
          <MonoValue
            tone={tone}
            className="mt-1.5 block text-[34px] font-semibold tracking-tight leading-tight sm:text-[40px]"
          >
            {valueDisplay}
          </MonoValue>
          <MonoValue
            tone={isBreakEven ? "muted" : tone}
            className="mt-1 block text-[12.5px]"
          >
            {formatPercent(realizedPercent)}
          </MonoValue>
        </div>
        <p className="max-w-[34ch] text-[11.5px] leading-relaxed text-muted-foreground sm:text-right">
          {t.realized.caption}
        </p>
      </div>
    </Panel>
  );
}
