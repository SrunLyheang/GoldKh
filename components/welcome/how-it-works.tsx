"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { SectionEyebrow } from "./section-eyebrow";
import { useReveal, useInView } from "./use-reveal";

const SERIF = "font-[family-name:var(--font-newsreader)]";

// Three steps as numbered ledger rows on a tinted band (bg-card +
// hairline top/bottom), so the page alternates ground / card / ground
// down its length. Numbering earns its place here — this is a real
// sequence, do it once then once more. Step numbers are mono tabular,
// like every figure on the site, and stay quiet (foreground/40, not the
// scarce brand gold).
export function HowItWorks() {
  const { t } = useLocale();
  const s = t.welcome.steps;
  const { ref, revealClass, style } = useReveal<HTMLDivElement>();
  const { ref: listRef, visible: listVisible } = useInView<HTMLOListElement>();

  const steps = [
    { n: "01", title: s.oneTitle, body: s.oneBody },
    { n: "02", title: s.twoTitle, body: s.twoBody },
    { n: "03", title: s.threeTitle, body: s.threeBody },
  ];

  return (
    <section id="how" className="scroll-mt-24 border-y border-border bg-card">
      <div
        ref={ref}
        style={style}
        className={`${revealClass} mx-auto max-w-3xl px-5 py-20 sm:py-28`}
      >
        <SectionEyebrow>{s.kicker}</SectionEyebrow>
        <h2
          className={`${SERIF} mt-4 text-[28px] font-normal leading-[1.12] tracking-[-0.02em] text-foreground sm:text-[38px]`}
        >
          {s.title}
        </h2>

        <ol
          ref={listRef}
          className={`landing-stagger ${
            listVisible ? "is-visible" : ""
          } mt-12 border-t border-border`}
        >
          {steps.map(({ n, title, body }) => (
            <li
              key={n}
              className="grid grid-cols-[2.25rem_1fr] gap-x-4 gap-y-1.5 border-b border-border py-7 sm:grid-cols-[2.25rem_14rem_1fr] sm:items-baseline sm:gap-x-6"
            >
              <span className="font-mono tabular-nums text-[12px] text-foreground/40">
                {n}
              </span>
              <h3 className={`${SERIF} text-[18px] text-foreground`}>{title}</h3>
              <p className="col-span-2 text-[14px] leading-[1.7] text-muted-foreground sm:col-span-1">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
