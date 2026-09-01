"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const STORAGE_KEY = "goldkh-theme";

// Adding a theme = one entry here + one `:root[data-theme="<id>"]` token
// block in globals.css; components just read tokens. Default is
// `liquid-glass`. The bare `:root` block is not selectable — it's the
// pre-hydration fallback and the base other themes derive `--glass-*` from.
// One-render swap on mount; dashboard is behind auth + "use client", so no
// SSR consequence.
export const THEMES = [
  { id: "liquid-glass", label: "Liquid Glass" },
  { id: "ledger", label: "Ledger" },
  { id: "midnight", label: "Midnight" },
  { id: "emerald", label: "Emerald" },
  { id: "coral", label: "Coral" },
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

// Client-only, localStorage-backed: renders the default, then reads the
// stored preference in a mount effect (one-render swap, no SSR consequence).
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("liquid-glass");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isThemeId(stored)) {
      // In an effect, not a lazy initializer: reading localStorage there
      // would make the client's first paint disagree with the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", theme);
    // Clear on change/unmount so the dashboard theme doesn't leak onto
    // routes outside this provider (e.g. marketing pages).
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
