"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { formatPercent, formatUsd } from "@/lib/format/money";
import { PULSE_TONE, toneFromAmount } from "@/lib/format/tone";
import { t } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/utils";
import { COUNT_UP_MS } from "@/lib/ui/use-count-up";
import { useValuePulse } from "@/lib/ui/use-value-pulse";
import { CountUpValue } from "./count-up-value";
import { MonoValue } from "./mono-value";
import { Surface } from "./surface";

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
            <p className="tt-label text-label text-muted-foreground">
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
                {/* Isolated in CountUpValue so the per-frame roll doesn't
                    re-render this glass panel. */}
                <CountUpValue
                  target={Number(realizedUsd)}
                  from={0}
                  durationMs={COUNT_UP_MS}
                  format={(value) => formatUsd(String(value))}
                  tone={tone}
                  signed
                  className="block text-display font-semibold tracking-tight leading-tight sm:text-display-lg"
                />
              </span>
              <MonoValue
                tone={isBreakEven ? "muted" : tone}
                signed
                className="mt-1 block text-detail"
              >
                {formatPercent(realizedPercent)}
              </MonoValue>
            </div>
          )}
        </div>
        {!collapsed && (
          <p className="max-w-[34ch] text-label leading-relaxed text-muted-foreground sm:text-right">
            {t.realized.caption}
          </p>
        )}
      </div>
    </Surface>
  );
}
