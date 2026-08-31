"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { dictionary, type Dictionary, type Locale } from "./dictionary";

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Only "en" ships today. This provider is kept as the seam a second
// locale would slot into (restore a `const km: typeof en` in dictionary.ts,
// add persistence + a toggle here) — until then it just stamps `lang` on
// the document and hands the dictionary down.
export function LocaleProvider({ children }: { children: ReactNode }) {
  const locale: Locale = "en";

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, t: dictionary[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
