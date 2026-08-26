"use client";

import type { GoldUnit } from "@/lib/calc/units";
import { useLocale } from "@/lib/i18n/locale-context";
import { SegmentedControl } from "./segmented-control";

export function UnitToggle({
  value,
  onChange,
  className,
}: {
  value: GoldUnit;
  onChange: (unit: GoldUnit) => void;
  className?: string;
}) {
  const { t } = useLocale();

  return (
    <SegmentedControl
      ariaLabel="Display unit"
      value={value}
      onChange={onChange}
      className={className}
      options={[
        { value: "chi", label: t.unit.chi },
        { value: "damlung", label: t.unit.damlung },
      ]}
    />
  );
}
