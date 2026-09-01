"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { formatPercent, formatUsd } from "@/lib/format/money";
import { toneFromAmount } from "@/lib/format/tone";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";
import { COUNT_UP_MS, useCountUp } from "@/lib/ui/use-count-up";
import { useValuePulse } from "@/lib/ui/use-value-pulse";
import { MonoValue } from "./mono-value";
import { Surface } from "./surface";

const PULSE_TONE: Record<string, string> = {
  gain: "var(--state-gain)",
  loss: "var(--destructive)",
};

interface RealizedPanelProps {
  realizedUsd: string;
  realizedPercent: string;
  saleCount: number;
}

// Persisted so a user who has hidden the figure keeps it hidden across
// reloads and navigations. Display-only, never leaves the browser —
// same class of state as goldkh-prefs.
const STORAGE_KEY = "goldkh-realized-collapsed";

// A full-width readout, shaped like the hero price card (lg elevation,
// left figure / right context, same mobile stack) so the dashboard opens
// and closes on two matching readouts: spot price at the top, realized
// result here. Rendered by DashboardContent only when saleCount > 0.
//
// The whole header is a toggle: clicking it collapses the panel down to
// just its label so the realized number can be hidden from view (e.g.
// on a shared screen), and clicking again brings it back. Starts
// expanded on the server and the first client paint, then reads the
// stored preference in an effect — the same hydration-safe pattern as
// PrefsProvider / ThemeProvider.
export function RealizedPanel({
  realizedUsd,
  realizedPercent,
  saleCount,
}: RealizedPanelProps) {
  const { t } = useLocale();
  const bodyId = useId();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (private mode, blocked) — stay expanded.
    }
  }, []);

  function toggle() {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Non-fatal — the toggle still works for this session.
      }
      return next;
    });
  }

  // Exactly zero is "broke even" — no gain/loss colour.
  const isBreakEven = Number(realizedUsd) === 0;
  const tone = isBreakEven ? "foreground" : toneFromAmount(realizedUsd);

  // Rolls from zero to the realized figure on every page entry, the same
  // way the stat cards and hero price do — positive rolls up, negative
  // down. A later change (a new sale recomputes it) snaps. The percent
  // sub-line snaps; reduced-motion snaps everything.
  const valueDisplay = useCountUp(Number(realizedUsd), {
    from: 0,
    durationMs: COUNT_UP_MS,
    format: (value) => formatUsd(String(value)),
  });
  const pulsing = useValuePulse(realizedUsd);

  return (
    <Surface size="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
        <div className="min-w-0">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-controls={collapsed ? undefined : bodyId}
            aria-label={collapsed ? t.realized.show : t.realized.hide}
            className="-m-1 flex items-center gap-1.5 rounded p-1 outline-none transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                !collapsed && "rotate-180",
              )}
            />
            <p className="tt-label text-[11px] text-muted-foreground">
              <span className="tt-bracket">{t.realized.eyebrow}</span>{" "}
              {t.realized.fromSales(saleCount)}
            </p>
          </button>
          {!collapsed && (
            <div id={bodyId}>
              <span
                className={cn("mt-1.5 block", pulsing && "value-pulse-active")}
                style={{ "--pulse-tone": PULSE_TONE[tone] ?? "var(--primary)" } as CSSProperties}
              >
                <MonoValue
                  tone={tone}
                  signed
                  className="block text-[34px] font-semibold tracking-tight leading-tight sm:text-[40px]"
                >
                  {valueDisplay}
                </MonoValue>
              </span>
              <MonoValue
                tone={isBreakEven ? "muted" : tone}
                signed
                className="mt-1 block text-[12.5px]"
              >
                {formatPercent(realizedPercent)}
              </MonoValue>
            </div>
          )}
        </div>
        {!collapsed && (
          <p className="max-w-[34ch] text-[11.5px] leading-relaxed text-muted-foreground sm:text-right">
            {t.realized.caption}
          </p>
        )}
      </div>
    </Surface>
  );
}
