export type GainLossTone = "gain" | "loss";

export function toneFromAmount(amount: string | number): GainLossTone {
  return Number(amount) >= 0 ? "gain" : "loss";
}
