"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/lib/i18n/locale-context";
import { SectionEyebrow } from "./section-eyebrow";
import { useReveal, useInView } from "@/components/motion/use-reveal";

const SERIF = "font-[family-name:var(--font-newsreader)]";

// Hairline bento: the lead cell (weighted-average cost, the idea the
// whole product turns on) sits wide over two supporting cells. Single 1px
// ruled block — gap-px over a bg-border fill, same as the dashboard stat
// grid — so it reads as one sheet, not three cards.
export function FeatureGrid() {
  const { t } = useLocale();
  const f = t.welcome.features;
  const {
    ref: headRef,
    revealClass: headReveal,
    style: headStyle,
  } = useReveal<HTMLDivElement>();
  const { ref: gridRef, visible: gridVisible } = useInView<HTMLDivElement>();

  return (
    <section
      id="features"
      className="mx-auto max-w-5xl scroll-mt-24 px-5 py-20 sm:py-28"
    >
      <div
        ref={headRef}
        style={headStyle}
        className={`${headReveal} max-w-2xl`}
      >
        <SectionEyebrow>{f.kicker}</SectionEyebrow>
        <h2
          className={`${SERIF} mt-4 text-[28px] font-normal leading-[1.12] tracking-[-0.02em] text-foreground sm:text-[38px]`}
        >
          {f.title}
        </h2>
      </div>

      <div
        ref={gridRef}
        className={`landing-stagger ${
          gridVisible ? "is-visible" : ""
        } mt-12 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2`}
      >
        <article className="bg-card p-7 sm:col-span-2 sm:p-9">
          <div className="flex items-start gap-4">
            <IconChip>
              <IconScale />
            </IconChip>
            <div>
              <h3 className={`${SERIF} text-[19px] text-foreground`}>
                {f.avgCostTitle}
              </h3>
              <p className="mt-2 max-w-[58ch] text-[13.5px] leading-[1.7] text-muted-foreground">
                {f.avgCostBody}
              </p>
            </div>
          </div>
        </article>

        <FeatureCell
          icon={<IconPulse />}
          title={f.livePriceTitle}
          body={f.livePriceBody}
        />
        <FeatureCell
          icon={<IconCoins />}
          title={f.unitsTitle}
          body={f.unitsBody}
        />
      </div>
    </section>
  );
}

function FeatureCell({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="bg-card p-7 sm:p-9">
      <IconChip>{icon}</IconChip>
      <h3 className={`${SERIF} mt-4 text-[17px] text-foreground`}>{title}</h3>
      <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted-foreground">
        {body}
      </p>
    </article>
  );
}

function IconChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex w-fit rounded-md border border-border bg-muted p-2.5 text-foreground">
      {children}
    </span>
  );
}

const svgProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function IconScale() {
  return (
    <svg {...svgProps}>
      <path d="M12 3v18M7 6h10M9 21h6" />
      <path d="M7 6 4 13a3 3 0 0 0 6 0L7 6ZM17 6l-3 7a3 3 0 0 0 6 0l-3-7Z" />
    </svg>
  );
}

function IconPulse() {
  return (
    <svg {...svgProps}>
      <path d="M3 12h3.5l2.2-6 3.4 12 2.3-8 1.4 2H21" />
    </svg>
  );
}

function IconCoins() {
  return (
    <svg {...svgProps}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.66 3.13 3 7 3s7-1.34 7-3V6M5 12v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6" />
    </svg>
  );
}
