"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "goldkh-landing-theme";

export type LandingTheme = "light" | "dark";

interface LandingThemeValue {
  theme: LandingTheme;
  setTheme: (theme: LandingTheme) => void;
  toggle: () => void;
}

const LandingThemeContext = createContext<LandingThemeValue | null>(null);

// Self-contained from the dashboard's ThemeProvider (lib/theme): the
// marketing page has its own light/dark pair and its own storage key.
// Light is the default — it starts "light" on the server and the first
// client paint so the SSR markup and hydration agree; an effect then
// applies a previously stored choice. One extra render in that case —
// the same trade-off LocaleProvider makes.
export function LandingThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<LandingTheme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(stored);
    }
  }, []);

  function setTheme(next: LandingTheme) {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LandingThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggle: () => setTheme(theme === "light" ? "dark" : "light"),
      }}
    >
      {children}
    </LandingThemeContext.Provider>
  );
}

export function useLandingTheme(): LandingThemeValue {
  const ctx = useContext(LandingThemeContext);
  if (!ctx) {
    throw new Error("useLandingTheme must be used within LandingThemeProvider");
  }
  return ctx;
}
