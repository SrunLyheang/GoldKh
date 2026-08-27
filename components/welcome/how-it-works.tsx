"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { SectionEyebrow } from "./section-eyebrow";

// Three steps on a tinted full-bleed band (bg-card + hairline top/bottom
// borders), mirroring the TrustStrip treatment so the page alternates
// background / card / background down its length. Step numbers are mono
// tabular, like every other figure on the site.
export function HowItWorks() {
  const { t } = useLocale();
  const s = t.welcome.steps;

  const steps = [
    { n: "01", title: s.oneTitle, body: s.oneBody },
    { n: "02", title: s.twoTitle, body: s.twoBody },
    { n: "03", title: s.threeTitle, body: s.threeBody },
  ];

  return (
    <section id="how" className="scroll-mt-20 border-y border-border bg-card">
      <div className="mx-auto max-w-[1120px] px-5 py-20 sm:px-8 sm:py-28">
        <SectionEyebrow>{s.kicker}</SectionEyebrow>
        <h2 className="tt-heading mt-4 max-w-[20ch] text-2xl leading-[1.1] sm:text-4xl">
          {s.title}
        </h2>

        <ol className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-3">
          {steps.map(({ n, title, body }) => (
            <li key={n} className="bg-card p-6 sm:p-8">
              <span className="font-mono tabular-nums text-[13px] text-primary">
                {n}
              </span>
              <h3 className="tt-heading mt-4 text-[15px] text-foreground">
                {title}
              </h3>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
