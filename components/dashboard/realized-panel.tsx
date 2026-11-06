"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { formatPercent, formatUsd } from "@/lib/format/money";
import { PULSE_TONE, toneFromAmount } from "@/lib/format/tone";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { useValuePulse } from "@/lib/ui/use-value-pulse";
import { MonoValue } from "./mono-value";

interface RealizedPanelProps {
  realizedUsd: string;
  realizedPercent: string;
  saleCount: number;
}

// Persisted so a hidden figure stays hidden across reloads. Display-only,
// browser-local.
const STORAGE_KEY = "goldkh-realized-collapsed";

// Full-width readout shaped like the hero price card, so the dashboard opens
// and closes on two matching readouts. Rendered only when saleCount > 0.
// The header is a toggle: collapse to just the label to hide the number
// (e.g. on a shared screen). Starts expanded, then reads the stored
// preference in an effect (hydration-safe, like PrefsProvider/ThemeProvider).
export function RealizedPanel({
  realizedUsd,
  realizedPercent,
  saleCount,
}: RealizedPanelProps) {
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

  // Rolls from zero on every page entry, like the stat cards and hero
  // price; a later change (new sale) snaps.
  const pulsing = useValuePulse(realizedUsd);

  return (
    <aside
      aria-label={`${t.realized.eyebrow} ${t.realized.fromSales(saleCount)}`}
      className="mt-6"
    >
      {/* A note in the margin, in the user's own hand: money already
          made (or lost) on gold that has left the notebook. It can be
          folded away for a shared screen. */}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={collapsed ? undefined : bodyId}
          aria-label={collapsed ? t.realized.show : t.realized.hide}
          className="press -mx-1 inline-flex min-h-9 items-center gap-1.5 rounded-md px-1 text-detail text-muted-foreground hover:text-foreground"
        >
          <ChevronDown
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-(--dur-micro)",
              collapsed && "-rotate-90",
            )}
          />
          <span className="hand text-body">
            {t.realized.eyebrow} {t.realized.fromSales(saleCount)}
          </span>
        </button>
        {!collapsed && (
          <span
            id={bodyId}
            className="inline-flex items-baseline gap-2 text-emphasis"
          >
            <span
              className={cn("inline-block px-1", pulsing && "value-pulse-active")}
              style={{ "--pulse-tone": PULSE_TONE[tone] ?? "var(--gold-leaf)" } as CSSProperties}
            >
              <MonoValue tone={tone} signed className="font-sans font-semibold">
                {formatUsd(realizedUsd)}
              </MonoValue>
            </span>
            <MonoValue tone={isBreakEven ? "muted" : tone} signed className="font-sans text-detail">
              {formatPercent(realizedPercent)}
            </MonoValue>
          </span>
        )}
      </div>
      {!collapsed && (
        <p className="mt-1 max-w-[46ch] text-label text-faint">{t.realized.caption}</p>
      )}
    </aside>
  );
}
