import type { GoldUnit } from "@/lib/calc/units";
import type { Dictionary } from "./dictionary";

interface UnitLabels {
  primary: string;
  secondary: string;
  primaryLower: string;
  secondaryLower: string;
}

// Every dashboard surface with a unit-aware figure needs both the
// selected unit's label and its counterpart (e.g. the hero card's "/oz ·
// $X/chi" secondary line), in whatever casing that surface already uses
// (headings keep the dictionary's capitalization, inline copy lowercases
// it) — centralized here so the five call sites that used to re-derive
// this independently can't drift.
export function unitLabels(t: Dictionary, unit: GoldUnit): UnitLabels {
  const primary = unit === "chi" ? t.unit.chi : t.unit.damlung;
  const secondary = unit === "chi" ? t.unit.damlung : t.unit.chi;
  return {
    primary,
    secondary,
    primaryLower: primary.toLowerCase(),
    secondaryLower: secondary.toLowerCase(),
  };
}
