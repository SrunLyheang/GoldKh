"use client";

import { Activity, Coins, Languages, Scale } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { SectionEyebrow } from "./section-eyebrow";

// Four features in a hairline 2×2 grid — same gap-px-on-border-fill
// construction the dashboard stat grid uses, so the cells read as one
// ruled block rather than four floating cards.
export function FeatureGrid() {
  const { t } = useLocale();
  const f = t.welcome.features;

  const items = [
    { icon: Scale, title: f.avgCostTitle, body: f.avgCostBody },
    { icon: Activity, title: f.livePriceTitle, body: f.livePriceBody },
    { icon: Coins, title: f.unitsTitle, body: f.unitsBody },
    { icon: Languages, title: f.bilingualTitle, body: f.bilingualBody },
  ];

  return (
    <section
      id="features"
      className="mx-auto max-w-[1120px] scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28"
    >
      <SectionEyebrow>{f.kicker}</SectionEyebrow>
      <h2 className="tt-heading mt-4 max-w-[22ch] text-2xl leading-[1.1] sm:text-4xl">
        {f.title}
      </h2>

      <div className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2">
        {items.map(({ icon: Icon, title, body }) => (
          <article key={title} className="bg-card p-6 sm:p-8">
            <span className="inline-flex border border-border bg-muted p-2.5 text-primary">
              <Icon className="h-4 w-4" aria-hidden strokeWidth={1.75} />
            </span>
            <h3 className="tt-heading mt-5 text-[15px] text-foreground">{title}</h3>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
