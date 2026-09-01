"use client";

import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { Panel } from "@/components/dashboard/panel";
import { usePrefs } from "@/lib/prefs/prefs-context";
import { t } from "@/lib/i18n/dictionary";
import type { GoldUnit } from "@/lib/calc/units";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--glass-border-to) py-3.5 last:border-0">
      <span className="tt-label text-[11px] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}

// Display-only preferences, persisted to localStorage via PrefsProvider.
// Changing a value saves immediately — there is no explicit save button
// (dashboard-expansion-plan.md §6.2). Currency is stored but only USD is
// honoured anywhere today; KHR display is deferred project-wide.
export function PreferencesSettings() {
  const { prefs, setPrefs } = usePrefs();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="tt-heading tt-bracket text-[15px] text-foreground">
        {t.settings.preferencesTitle}
      </h2>
      <Panel size="lg" className="flex flex-col">
        <Field label={t.settings.defaultUnit}>
          <SegmentedControl
            ariaLabel={t.settings.defaultUnit}
            value={prefs.displayUnit}
            onChange={(v) => setPrefs({ displayUnit: v as GoldUnit })}
            options={[
              { value: "chi", label: t.settings.unitChi },
              { value: "damlung", label: t.settings.unitDamlung },
            ]}
          />
        </Field>
        <Field label={t.settings.defaultCurrency}>
          <SegmentedControl
            ariaLabel={t.settings.defaultCurrency}
            value={prefs.currency}
            onChange={(v) => setPrefs({ currency: v as "USD" | "KHR" })}
            options={[{ value: "USD", label: t.settings.currencyUsd }]}
          />
        </Field>
        <Field label={t.settings.theme}>
          <ThemeToggle />
        </Field>
      </Panel>
    </section>
  );
}
