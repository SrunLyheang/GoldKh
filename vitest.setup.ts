import "@testing-library/jest-dom/vitest";
import { createElement } from "react";
import { cleanup, configure } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// CountUpValue (and AnimatedPnlCard) render a visually-hidden duplicate of
// the settled figure as a width sizer, so the card's box doesn't jitter
// while the number rolls. It carries `data-count-up-sizer`; excluding it
// here keeps `getByText("$1,234.00")` from matching two nodes.
configure({ defaultIgnore: "script, style, [data-count-up-sizer]" });

// Not automatic under Vitest (unlike Jest's testing-library preset) — each
// component test's rendered DOM would otherwise stack up across tests in
// the same file, breaking any query that expects exactly one match.
afterEach(() => {
  cleanup();
});

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

const motionValueStub = (value: unknown = 0) => ({
  get: () => value,
  set: () => {},
  jump: () => {},
});

vi.mock("motion/react", () => ({
  useReducedMotion: () => true,
  useMotionValue: (initial: number) => motionValueStub(initial),
  // Derived-value hooks: component tests take the reduced-motion branch
  // and never read these, but the hooks still run before that branch, so
  // they must exist and return a motion-value-like object.
  useTransform: () => motionValueStub(0),
  useSpring: () => motionValueStub(0),
  useMotionTemplate: () => motionValueStub(""),
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
