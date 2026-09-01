"use client";

import { useEffect, useRef, useState } from "react";

interface InViewResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  visible: boolean;
}

// One-shot "has this element entered the viewport yet" signal, driving
// the `.landing-stagger` containers. Same observer settings, same
// disconnect-after-first-hit behaviour — entry never reverses on
// scroll-up. Falls back to visible where there is no IntersectionObserver
// (jsdom, very old browsers), deferred to an effect so SSR and the
// client's first paint agree.
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
