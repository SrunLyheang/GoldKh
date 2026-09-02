import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The DESIGN.md dashboard type scale (§ Typography) adds semantic font-size
// utilities — text-label, text-figure, text-display, … — generated from the
// --text-* tokens in globals.css. tailwind-merge doesn't ship knowledge of
// them, so it would treat a bare `text-display` as a COLOR and let it clobber
// `text-state-gain` / `text-destructive` when both land in the same cn() call
// (MonoValue passes the size via `className`, last, so it would always win).
// Register them as font-size so a scale class only ever conflicts with another
// scale class.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        "text-micro",
        "text-label",
        "text-detail",
        "text-body",
        "text-emphasis",
        "text-figure",
        "text-figure-lg",
        "text-display",
        "text-display-lg",
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
