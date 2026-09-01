"use client";

import { useRef, type CSSProperties } from "react";

interface SectionEnterResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  revealClass: string;
  style: CSSProperties;
}

// A JS-independent section entrance. Returns the same shape as
// `useReveal` — `{ ref, revealClass, style }` — but `revealClass` is a
// static `.dash-enter`, a pure-CSS fade-up keyframe that plays the
// moment the element paints (SSR markup included). No
// IntersectionObserver, no hydration gate: the dashboard is a
// check-the-price-and-leave surface, and blocking first paint on the JS
// bundle so a scroll-reveal could run made it feel slow. The landing
// keeps `useReveal` (its lush blur-in entrance is the point there).
//
// `delayMs` feeds `--enter-delay` for a light stagger; `ref` is
// returned only so call sites written against `useReveal` need no JSX
// change.
export function useSectionEnter<T extends HTMLElement = HTMLDivElement>(
  delayMs = 0,
): SectionEnterResult<T> {
  const ref = useRef<T>(null);
  return {
    ref,
    revealClass: "dash-enter",
    style: { "--enter-delay": `${delayMs}ms` } as CSSProperties,
  };
}
