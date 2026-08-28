"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface RevealResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  revealClass: string;
  style: CSSProperties;
}

interface InViewResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  visible: boolean;
}

// One-shot "has this element entered the viewport yet" signal, shared by
// `useReveal` (below) and the `.landing-stagger` containers. Same
// observer settings, same disconnect-after-first-hit behaviour — entry
// never reverses on scroll-up. Falls back to visible where there is no
// IntersectionObserver (jsdom, very old browsers), deferred to an effect
// so SSR and the client's first paint agree.
export function useInView<T extends HTMLElement = HTMLDivElement>(): InViewResult<T> {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

// Quiet scroll-entry. Returns a ref to attach to the element, the class
// pair that drives the CSS transition in globals.css (`.landing-reveal`
// / `.is-visible`), and a `--reveal-delay` style for staggering. The
// observer disconnects after the first intersection — entry is a
// one-shot, elements don't re-hide on scroll-up. `prefers-reduced-
// motion` is handled in CSS, so this still runs but the transition is a
// no-op.
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  delayMs = 0
): RevealResult<T> {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (jsdom, very old browsers): show at once.
    // Deferred to this effect rather than a lazy initializer so the
    // server render (no IO) and the client's first paint agree.
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return {
    ref,
    revealClass: visible ? "landing-reveal is-visible" : "landing-reveal",
    style: { "--reveal-delay": `${delayMs}ms` } as CSSProperties,
  };
}
