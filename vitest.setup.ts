import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { dictionary } from "@/lib/i18n/dictionary";

// Not automatic under Vitest (unlike Jest's testing-library preset) — each
// component test's rendered DOM would otherwise stack up across tests in
// the same file, breaking any query that expects exactly one match.
afterEach(() => {
  cleanup();
});

// Every real render of these components sits under DashboardShell's
// LocaleProvider; existing component tests render them standalone, so
// useLocale() would otherwise throw "must be used within LocaleProvider".
// Mocked globally (English, fixed) rather than adding a provider wrapper
// to every test file — none of these tests are about locale switching
// itself (that's LanguageToggle's own concern).
vi.mock("@/lib/i18n/locale-context", () => ({
  useLocale: () => ({ locale: "en", setLocale: () => {}, t: dictionary.en }),
  LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
}));
