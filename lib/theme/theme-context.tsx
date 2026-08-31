"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "goldkh-theme";

// Adding a theme is one entry here plus one `:root[data-theme="<id>"]`
// token block in app/globals.css — components never change, they read
// the tokens. `vault` is the default (no `data-theme` attribute) so the
// server-rendered markup and the first client paint always agree.
export const THEMES = [
  { id: "vault", label: "Vault" },
  { id: "ledger", label: "Ledger" },
  { id: "midnight", label: "Midnight" },
  { id: "emerald", label: "Emerald" },
  { id: "terminal", label: "Terminal" },
  { id: "porcelain", label: "Porcelain" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const THEME_IDS = THEMES.map((theme) => theme.id) as readonly string[];

function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEME_IDS.includes(value);
}

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// Mirrors LocaleProvider: client-only, localStorage-backed, starts on
// the default ("vault") every render, then reads the stored preference
// in an effect. The dashboard is entirely behind auth and "use client",
// so there is no server-rendering consequence beyond the one extra
// render when a non-default theme was stored.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("vault");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) {
      // Synchronous by necessity — see LocaleProvider's matching comment:
      // a lazy useState initializer reading localStorage would make the
      // client's first paint disagree with the server-rendered default.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "vault") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", theme);
    }
    // Clear when the theme changes or the provider unmounts, so a
    // non-default theme doesn't leak onto routes that render outside this
    // provider (e.g. the marketing pages).
    return () => root.removeAttribute("data-theme");
  }, [theme]);

  function setTheme(next: ThemeId) {
    setThemeState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
