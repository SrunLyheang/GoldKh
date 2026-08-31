"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { GoldUnit } from "@/lib/calc/units";

const STORAGE_KEY = "goldkh-prefs";

// Display-only preferences, persisted to localStorage. Not user data —
// they never leave the browser and are not sent to the server. `currency`
// is stored today but only "USD" is honoured anywhere; KHR display is
// deferred project-wide (project-overview.md).
export interface Prefs {
  displayUnit: GoldUnit;
  currency: "USD" | "KHR";
}

export const DEFAULT_PREFS: Prefs = { displayUnit: "damlung", currency: "USD" };

function parseStored(raw: string | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return {
      displayUnit:
        parsed.displayUnit === "chi" || parsed.displayUnit === "damlung"
          ? parsed.displayUnit
          : DEFAULT_PREFS.displayUnit,
      currency:
        parsed.currency === "USD" || parsed.currency === "KHR"
          ? parsed.currency
          : DEFAULT_PREFS.currency,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

interface PrefsContextValue {
  prefs: Prefs;
  setPrefs: (patch: Partial<Prefs>) => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

// Mirrors ThemeProvider / LocaleProvider: starts on DEFAULT_PREFS every
// render, then reads the stored value in an effect so the server-rendered
// markup and the first client paint agree.
export function PrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setState] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => {
    const stored = parseStored(window.localStorage.getItem(STORAGE_KEY));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(stored);
  }, []);

  function setPrefs(patch: Partial<Prefs>) {
    setState((current) => {
      const next = { ...current, ...patch };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  return (
    <PrefsContext.Provider value={{ prefs, setPrefs }}>
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs(): PrefsContextValue {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
