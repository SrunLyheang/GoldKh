"use client";

import { SegmentedControl } from "@/components/dashboard/segmented-control";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { SettingsRow, SettingsSection } from "./section";
import { usePrefs } from "@/lib/prefs/prefs-context";
import { t } from "@/lib/i18n/dictionary";
import type { GoldUnit } from "@/lib/calc/units";

// Display-only preferences, persisted to localStorage via PrefsProvider.
// Changing a value saves immediately — there is no explicit save button.
export function PreferencesSettings() {
  const { prefs, setPrefs } = usePrefs();

  return (
    <SettingsSection
      title={t.settings.preferencesTitle}
      description={t.settings.preferencesDescription}
    >
        <SettingsRow title={t.settings.defaultUnit} description={t.settings.defaultUnitDescription}>
          <SegmentedControl
            ariaLabel={t.settings.defaultUnit}
            value={prefs.displayUnit}
            onChange={(v) => setPrefs({ displayUnit: v as GoldUnit })}
            options={[
              { value: "chi", label: t.settings.unitChi },
              { value: "damlung", label: t.settings.unitDamlung },
            ]}
          />
        </SettingsRow>
        <SettingsRow title={t.settings.theme} description={t.settings.themeDescription}>
          <ThemeToggle className="bg-sunk" />
        </SettingsRow>
    </SettingsSection>
  );
}
