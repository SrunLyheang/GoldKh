import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
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
  useLocale: () => ({ locale: "en", t: dictionary.en }),
  LocaleProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// sonner needs a mounted <Toaster> and real timers to do anything useful;
// component tests only care that the right toast was requested. Mock the
// surface: `toast.success` / `toast.error` become spies, `<Toaster>`
// renders nothing. Assert against `vi.mocked(toast.error)` in a test.
vi.mock("sonner", () => {
  // `toast` is callable (notify.info) as well as carrying .success/.error.
  const toast = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { toast, Toaster: () => null };
});

// motion/react's animate loop needs rAF and real timers. Component tests
// only care about the settled value, so force the reduced-motion (snap)
// path, stub the primitives useCountUp builds on, and render `motion.*`
// elements as their plain DOM tag with the animation props stripped.
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "variants",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "whileInView",
  "layout",
  "layoutId",
  "drag",
  "viewport",
  "custom",
  "onUpdate",
]);

vi.mock("motion/react", () => ({
  useReducedMotion: () => true,
  useMotionValue: (initial: number) => ({
    get: () => initial,
    set: () => {},
    jump: () => {},
  }),
  animate: (
    _value: unknown,
    target: number,
    opts?: { onUpdate?: (v: number) => void }
  ) => {
    opts?.onUpdate?.(target);
    return { stop: () => {} };
  },
  motion: new Proxy({} as Record<string, unknown>, {
    get: (_target, tag: string) => {
      const Component = (props: Record<string, unknown>) => {
        const domProps: Record<string, unknown> = {};
        for (const key in props) {
          if (!MOTION_ONLY_PROPS.has(key)) domProps[key] = props[key];
        }
        return createElement(tag, domProps, props.children as never);
      };
      Component.displayName = `motion.${tag}`;
      return Component;
    },
  }),
}));
