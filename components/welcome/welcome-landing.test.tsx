// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WelcomeLanding } from "./welcome-landing";

// Mutable auth state so individual tests can flip to the signed-in view.
const authState = { isLoaded: true, isSignedIn: false };

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => authState,
}));

afterEach(() => {
  authState.isSignedIn = false;
});

describe("WelcomeLanding / NotebookLanding", () => {
  it("renders the main headline", () => {
    render(<WelcomeLanding />);
    expect(
      screen.getByRole("heading", { level: 1, name: /see what your gold is worth/i }),
    ).toBeInTheDocument();
  });

  it("renders the brand wordmark GoldKh", () => {
    render(<WelcomeLanding />);
    expect(screen.getAllByText(/GoldKh/i).length).toBeGreaterThan(0);
  });

  it("links each on-page anchor to a section that exists", () => {
    const { container } = render(<WelcomeLanding />);
    for (const [name, id] of [
      [/^Try a page$/i, "try"],
      [/^Chi & damlung$/i, "units"],
      [/^How it works$/i, "how"],
      [/^What it isn't$/i, "about"],
    ] as const) {
      const link = screen.getByRole("link", { name });
      expect(link).toHaveAttribute("href", `#${id}`);
      expect(container.querySelector(`#${id}`)).not.toBeNull();
    }
  });

  it("points every sign-up CTA at /sign-up", () => {
    render(<WelcomeLanding />);
    const ctas = screen.getAllByRole("link", { name: /Start your notebook|Sign up/i });
    expect(ctas.length).toBeGreaterThan(1);
    for (const cta of ctas) expect(cta).toHaveAttribute("href", "/sign-up");
  });

  it("links Log in to /sign-in", () => {
    render(<WelcomeLanding />);
    expect(screen.getByRole("link", { name: /Log in/i })).toHaveAttribute("href", "/sign-in");
  });

  it("shows the way back into the notebook, and no sign-up, when signed in", () => {
    authState.isSignedIn = true;
    render(<WelcomeLanding />);
    const links = screen.getAllByRole("link", { name: /my notebook/i });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: /Log in/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Start your notebook|Sign up/i }),
    ).not.toBeInTheDocument();
  });

  it("marks the example figures as indicative, not live", () => {
    render(<WelcomeLanding />);
    expect(screen.getByText(/indicative price for illustration only/i)).toBeInTheDocument();
  });

  it("states the real unit conversions", () => {
    render(<WelcomeLanding />);
    const units = screen.getByRole("region", { name: /chi and damlung/i });
    expect(units).toHaveTextContent(/1 damlung\s*=\s*10 chi/);
    expect(units).toHaveTextContent(/1 chi\s*=\s*3\.75 grams/);
  });
});

describe("ExampleNotebook (the landing hero)", () => {
  it("writes a new line and adds it to the sum", async () => {
    const user = userEvent.setup();
    render(<WelcomeLanding />);
    const lines = screen.getByRole("list", { name: /lines on this page/i });
    const before = within(lines).getAllByRole("listitem").length;

    await user.type(screen.getByLabelText(/how much gold/i), "3");
    await user.type(screen.getByLabelText(/price paid for one chi/i), "500");
    await user.click(screen.getByRole("button", { name: /write it down/i }));

    expect(within(lines).getAllByRole("listitem")).toHaveLength(before + 1);
    expect(lines).toHaveTextContent(/Bought\s*3 chi\s*at \$500\.00 a chi/);
    expect(screen.getByText(/Written: bought 3 chi/)).toHaveAttribute("role", "status");
  });

  it("explains a missing amount next to the form instead of failing silently", async () => {
    const user = userEvent.setup();
    render(<WelcomeLanding />);
    await user.click(screen.getByRole("button", { name: /write it down/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(/how much gold/i);
    expect(screen.getByLabelText(/how much gold/i)).toHaveAttribute("aria-invalid", "true");
  });

  it("crosses a line out", async () => {
    const user = userEvent.setup();
    render(<WelcomeLanding />);
    const lines = screen.getByRole("list", { name: /lines on this page/i });
    const before = within(lines).getAllByRole("listitem").length;
    await user.click(screen.getAllByRole("button", { name: /cross out/i })[0]);
    expect(within(lines).getAllByRole("listitem")).toHaveLength(before - 1);
  });

  it("re-values the page when the price is moved", () => {
    render(<WelcomeLanding />);
    expect(screen.getByLabelText(/drag today's price/i)).toHaveAttribute("type", "range");
  });
});
