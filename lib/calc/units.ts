import Decimal from "decimal.js";
import {
  CHI_PER_TROY_OZ,
  DAMLUNG_PER_TROY_OZ,
} from "@/lib/constants/units";

export type GoldUnit = "chi" | "damlung";

// Converts a quantity in chi or damlung to troy ounces. Kept as a string
// in, string out — callers hold values in the DB's numeric string shape,
// never a bare JS number, so a chi amount can't be silently mistaken for
// ounces.
export function toTroyOz(quantity: string, unit: GoldUnit): string {
  const perOz = unit === "chi" ? CHI_PER_TROY_OZ : DAMLUNG_PER_TROY_OZ;
  return new Decimal(quantity).div(perOz).toString();
}

// Inverse of toTroyOz, for rendering a troy-oz total back in chi or
// damlung on the dashboard.
export function fromTroyOz(troyOz: string, unit: GoldUnit): string {
  const perOz = unit === "chi" ? CHI_PER_TROY_OZ : DAMLUNG_PER_TROY_OZ;
  return new Decimal(troyOz).times(perOz).toString();
}

// A price quoted per chi/damlung, converted to price per troy oz.
export function priceToTroyOz(pricePerUnit: string, unit: GoldUnit): string {
  const unitInOz = toTroyOz("1", unit);
  return new Decimal(pricePerUnit).div(unitInOz).toString();
}

// Inverse of priceToTroyOz — a price quoted per troy oz, converted to
// price per chi/damlung, for display.
export function priceFromTroyOz(
  pricePerTroyOz: string,
  unit: GoldUnit
): string {
  const unitInOz = toTroyOz("1", unit);
  return new Decimal(pricePerTroyOz).times(unitInOz).toString();
}
