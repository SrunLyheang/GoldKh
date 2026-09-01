export type GainLossTone = "gain" | "loss";

export function toneFromAmount(amount: string | number): GainLossTone {
  return Number(amount) >= 0 ? "gain" : "loss";
}

// CSS var driving `--pulse-tone` on gain/loss figures (AnimatedPnlCard,
// RealizedPanel). Record<string, ...> since callers may index with a
// wider tone (e.g. RealizedPanel's break-even "foreground") and fall
// back to the default pulse colour.
export const PULSE_TONE: Record<string, string> = {
  gain: "var(--state-gain)",
  loss: "var(--destructive)",
};
