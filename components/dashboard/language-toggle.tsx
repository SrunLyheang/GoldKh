"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/dictionary";
import { SegmentedControl } from "./segmented-control";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <SegmentedControl
      ariaLabel="Language"
      value={locale}
      onChange={setLocale}
      className={className}
      options={[
        { value: "en" as Locale, label: "EN" },
        { value: "km" as Locale, label: "ខ្មែរ" },
      ]}
    />
  );
}
