"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export const THEME_STORAGE_KEY = "goldkh-theme";

// Two designed themes, not seven recolours: Night (default — the
// notebook under a lamp) and Day (the same notebook by a window). Adding
// a theme is one token block in globals.css plus one entry here.
export const THEMES = [
  { id: "night", label: "Night" },
  { id: "day", label: "Day" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

const THEME_IDS = THEMES.map((theme) => theme.id) as readonly string[];

export function isThemeId(value: string | null): value is ThemeId {
  return value !== null && THEME_IDS.includes(value);
}

// Runs before first paint (see ThemeScript) so a Day reader never sees a
// flash of Night. Kept tiny and dependency-free; storage may throw in
// private modes, which simply leaves the server default (night).
export const THEME_BOOT_SCRIPT = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="day"||t==="night")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />;
}

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>("night");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      // Storage blocked — keep the default.
    }
    if (isThemeId(stored)) {
      // In an effect, not a lazy initializer, so the first client render
      // matches the server's.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function setTheme(next: ThemeId) {
    setThemeState(next);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Non-fatal: the switch still applies for this visit.
    }
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
