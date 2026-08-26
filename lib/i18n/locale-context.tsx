"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { dictionary, type Dictionary, type Locale } from "./dictionary";

const STORAGE_KEY = "goldkh-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// Client-only, localStorage-backed locale (no server rendering
// consequence — the dashboard is already entirely behind auth and
// "use client"). Starts "en" on every render (server and first client
// paint agree, so no hydration mismatch), then reads the stored
// preference in an effect.
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "km") {
      // Deliberately synchronous: reading localStorage can't happen during
      // the initial render (no `window` on the server, and reading it in a
      // lazy useState initializer would make the client's first paint
      // disagree with the server-rendered "en" markup — a hydration
      // mismatch). Deferring to this effect is the standard fix, at the
      // cost of one extra render when a non-default locale was stored.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale) {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: dictionary[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
