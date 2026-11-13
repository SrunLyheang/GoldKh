"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LandingQuote } from "@/lib/landing/quote";
import { cn } from "@/lib/utils";
import { LANDING_COPY, type Lang } from "./copy";
import { kantumruy, koulen, moul } from "./fonts";
import { GoldTray } from "./gold-tray";
import { PriceRoll } from "./price-roll";
import styles from "./landing.module.css";

const LANG_KEY = "goldkh.landing.lang";

// The landing page: a gold shop's price board over its velvet tray.
// Desktop adds a worked example below the fold; phones keep just the
// board, the button and the gold.
export function Landing({ quote, year }: { quote: LandingQuote | null; year: number }) {
  const [lang, setLang] = useState<Lang>("en");
  const copy = LANDING_COPY[lang];
  const other = LANDING_COPY[lang === "en" ? "km" : "en"];

  // A per-viewer convenience only: remember the language, or pick Khmer
  // for a browser that asks for it. Storage can be unavailable (private
  // mode, blocked site data) — the page works the same without it.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = window.localStorage.getItem(LANG_KEY);
    } catch {
      saved = null;
    }
    const preferred =
      saved === "en" || saved === "km"
        ? saved
        : navigator.language.toLowerCase().startsWith("km")
          ? "km"
          : null;
    if (preferred && preferred !== "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage after hydration
      setLang(preferred);
    }
  }, []);

  function choose(next: Lang) {
    setLang(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      // Not remembered; still switched for this visit.
    }
  }

  const status = quote
    ? !quote.marketOpen
      ? copy.closedAsOf(quote.asOfDay[lang])
      : quote.isStale
        ? copy.staleAsOf(quote.asOf[lang])
        : copy.liveAsOf(quote.asOf[lang])
    : null;

  const rows = quote
    ? [
        { id: "damlung", label: copy.perDamlung, sub: `${other.perDamlung} · 37.5 g`, value: quote.perDamlung },
        { id: "chi", label: copy.perChi, sub: `${other.perChi} · 3.75 g`, value: quote.perChi },
        { id: "gram", label: copy.perGram, sub: other.perGram, value: quote.perGram },
      ]
    : [];

  return (
    <div
      lang={lang}
      className={cn(styles.root, koulen.variable, moul.variable, kantumruy.variable)}
    >
      <section className={styles.hero}>
        <header className={styles.header}>
          <Link href="/" className={styles.wordmark} aria-label="GoldKh">
            GOLDKH
          </Link>
          <div className={styles.headerEnd}>
            <div className={styles.lang} role="group" aria-label={copy.switchTo}>
              <button
                type="button"
                lang="en"
                className={styles.langButton}
                aria-pressed={lang === "en"}
                onClick={() => choose("en")}
              >
                EN
              </button>
              <button
                type="button"
                lang="km"
                className={styles.langButton}
                aria-pressed={lang === "km"}
                onClick={() => choose("km")}
              >
                ខ្មែរ
              </button>
            </div>
            <Link href="/dashboard" className={styles.openApp}>
              {copy.openApp}
            </Link>
          </div>
        </header>

        <div className={styles.board}>
          <h1>
            <span lang="km" className={styles.boardKm}>
              {LANDING_COPY.km.boardTitle}
            </span>
            <span lang="en" className={styles.boardEn}>
              {LANDING_COPY.en.boardTitle}
            </span>
          </h1>

          {quote ? (
            <>
              <dl className={cn(styles.rows, styles.num)}>
                {rows.map((row) => (
                  <div key={row.id} style={{ display: "contents" }}>
                    <dt className={styles.rowLabel}>
                      {row.label}
                      <small>{row.sub}</small>
                    </dt>
                    <dd className={styles.rowValue}>
                      <PriceRoll value={row.value} />
                    </dd>
                  </div>
                ))}
              </dl>
              <p className={cn(styles.status, styles.num)}>
                <span className={styles.changeLine}>{status}</span>
                {quote.change && quote.marketOpen && (
                  <>
                    <span
                      className={cn(
                        styles.changeLine,
                        quote.change.direction === "up"
                          ? styles.up
                          : quote.change.direction === "down"
                            ? styles.down
                            : undefined
                      )}
                    >
                      {copy.change(quote.change.direction, quote.change.amount)}
                    </span>
                  </>
                )}
              </p>
            </>
          ) : (
            <p className={styles.unavailable}>{copy.unavailable}</p>
          )}

          <Link href="/dashboard" className={styles.cta}>
            {copy.cta}
            <span aria-hidden="true">→</span>
          </Link>
          <p className={styles.ctaNote}>{copy.ctaNote}</p>
        </div>

        <div className={styles.trayWrap}>
          <div className={styles.trayDesktop}>
            <GoldTray variant="desktop" values={quote?.pieces ?? null} copy={copy} />
          </div>
          <div className={styles.trayMobile}>
            <GoldTray variant="mobile" values={quote?.pieces ?? null} copy={copy} />
          </div>
          <p className={styles.tapHint}>{copy.tapHint}</p>
        </div>
      </section>

      <section className={styles.explain} aria-labelledby="gk-explain">
        <div>
          <h2 id="gk-explain" className={styles.explainTitle}>
            {copy.explainTitle}
          </h2>
          <p className={styles.explainBody}>{copy.explainBody}</p>
          <p className={styles.explainNote}>{copy.explainNote}</p>
        </div>
        {quote?.example && (
          <div className={cn(styles.example, styles.num)}>
            <div className={styles.exampleRow}>
              <span>{copy.exampleBought}</span>
              <b>{copy.exampleQuantity}</b>
            </div>
            <div className={styles.exampleRow}>
              <span>{copy.examplePaid(quote.example.date[lang])}</span>
              <b>{copy.perDamlungShort(quote.example.paidPerDamlung)}</b>
            </div>
            <div className={cn(styles.exampleRow, styles.exampleWorth)}>
              <span>{copy.exampleWorth}</span>
              <b>{quote.example.worthToday}</b>
            </div>
            <div className={styles.exampleRow}>
              <span>
                {quote.example.direction === "up"
                  ? copy.exampleUp
                  : quote.example.direction === "down"
                    ? copy.exampleDown
                    : copy.exampleEven}
              </span>
              <b
                className={
                  quote.example.direction === "up"
                    ? styles.up
                    : quote.example.direction === "down"
                      ? styles.down
                      : undefined
                }
              >
                {quote.example.direction === "down" ? "−" : quote.example.direction === "up" ? "+" : ""}
                {quote.example.difference}
              </b>
            </div>
            <p className={styles.exampleCaption}>{copy.exampleCaption}</p>
          </div>
        )}
      </section>

      <footer className={styles.footer}>
        <p className={styles.footerNote}>{copy.explainNote}</p>
        <span className={styles.num}>© {year} GoldKh</span>
        <Link href="/dashboard">{copy.openApp}</Link>
      </footer>
    </div>
  );
}
