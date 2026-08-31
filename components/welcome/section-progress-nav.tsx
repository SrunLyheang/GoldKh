"use client";

import { useEffect, useState } from "react";

interface SectionLink {
  id: string;
  label: string;
}

// A fixed rail of dots down the right edge that tracks which section is
// in view and lets the visitor jump straight to one. Shown only on wide
// screens (there's no room beside the content on a phone, and normal
// scroll covers it). Each dot is a real link with an accessible label;
// the active one also gets aria-current.
//
// The <nav> itself is pointer-events:none so its centred, mostly-empty
// box never sits in front of the page and swallows clicks or
// drag-scrolls — only the dots (and their hover labels) take pointer
// events back. The label is absolutely positioned so a hidden label
// doesn't widen the hit target into an invisible strip down the edge.
export function SectionProgressNav({ sections }: { sections: SectionLink[] }) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        // The section covering the vertical middle of the viewport wins.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.5, 1] },
    );

    for (const { id } of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Page sections"
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-3 pointer-events-none"
    >
      {sections.map(({ id, label }) => {
        const active = id === activeId;
        return (
          <a
            key={id}
            href={`#${id}`}
            aria-label={label}
            aria-current={active ? "true" : undefined}
            className="group pointer-events-auto relative flex items-center justify-end py-1.5"
          >
            <span
              className={`pointer-events-none absolute right-full mr-2.5 whitespace-nowrap font-mono text-[10px] uppercase tracking-widest transition-all duration-300 ${
                active
                  ? "text-amber-300 opacity-100 translate-x-0"
                  : "text-white/40 opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"
              }`}
            >
              {label}
            </span>
            <span
              className={`rounded-full transition-all duration-300 ${
                active
                  ? "h-2.5 w-2.5 bg-amber-400 shadow-[0_0_12px_rgba(232,184,75,0.7)]"
                  : "h-1.5 w-1.5 bg-white/25 group-hover:bg-white/60"
              }`}
            />
          </a>
        );
      })}
    </nav>
  );
}
