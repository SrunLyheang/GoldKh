// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildLandingQuote } from "@/lib/landing/quote";
import { Landing } from "./landing";

// next/font only works inside the Next compiler.
vi.mock("./fonts", () => ({
  koulen: { variable: "f-koulen" },
  moul: { variable: "f-moul" },
  kantumruy: { variable: "f-kantumruy" },
}));

const NOW = new Date("2026-11-13T07:05:00Z");
const quote = buildLandingQuote({
  latest: { pricePerTroyOz: "3110.34768", capturedAt: NOW },
  isStale: false,
  marketOpen: true,
  yesterday: { pricePerTroyOz: "3079.2442032", capturedAt: new Date(NOW.getTime() - 86_400_000) },
  past: { pricePerTroyOz: "2488.278144", capturedAt: new Date(NOW.getTime() - 30 * 86_400_000) },
  now: NOW,
});

afterEach(() => {
  window.localStorage.clear();
});

describe("Landing", () => {
  it("shows today's price per damlung, chi and gram with its time", () => {
    render(<Landing quote={quote} year={2026} />);
    const board = screen.getByRole("heading", { level: 1 }).parentElement!;
    expect(within(board).getByText("$3,750.00")).toBeInTheDocument();
    expect(within(board).getByText("$375.00")).toBeInTheDocument();
    expect(within(board).getByText("$100.00")).toBeInTheDocument();
    expect(within(board).getByText(/Live spot price · as of 2:05/)).toBeInTheDocument();
    expect(within(board).getByText("▲ $37.50 since yesterday")).toBeInTheDocument();
  });

  it("sends every call to action into the app — no sign-up", () => {
    const { container } = render(<Landing quote={quote} year={2026} />);
    expect(
      screen.getByRole("link", { name: /Track your gold in real time/ })
    ).toHaveAttribute("href", "/dashboard");
    for (const link of screen.getAllByRole("link", { name: "Open the app" })) {
      expect(link).toHaveAttribute("href", "/dashboard");
    }
    expect(container.querySelector('a[href^="/sign-"]')).toBeNull();
  });

  it("says so plainly when there is no price at all", () => {
    render(<Landing quote={null} year={2026} />);
    expect(screen.getByText(/live price is unavailable/i)).toBeInTheDocument();
    expect(screen.queryByText(/\$\d/)).not.toBeInTheDocument();
  });

  it("names the day when the market is closed", () => {
    render(<Landing quote={{ ...quote, marketOpen: false }} year={2026} />);
    expect(screen.getByText(/Market closed · last price Fri 2:05/)).toBeInTheDocument();
    expect(screen.queryByText(/since yesterday/)).not.toBeInTheDocument();
  });

  it("lifts a piece of gold to show what it's worth today", async () => {
    const user = userEvent.setup();
    render(<Landing quote={quote} year={2026} />);
    const [leaf] = screen.getAllByRole("button", { name: /1 damlung leaf/ });
    expect(leaf).toHaveAttribute("aria-pressed", "false");
    await user.click(leaf);
    expect(leaf).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("$3,750.00 today").length).toBeGreaterThan(0);
    await user.keyboard("{Escape}");
    expect(leaf).toHaveAttribute("aria-pressed", "false");
  });

  it("shows the worked example at real past and present prices", () => {
    render(<Landing quote={quote} year={2026} />);
    expect(screen.getByText("On 14 Oct 2026, at")).toBeInTheDocument();
    expect(screen.getByText("$3,000.00 / damlung")).toBeInTheDocument();
    expect(screen.getByText("+$1,725.00")).toBeInTheDocument();
  });

  it("switches to Khmer and remembers the choice", async () => {
    const user = userEvent.setup();
    const { container } = render(<Landing quote={quote} year={2026} />);
    await user.click(screen.getByRole("button", { name: "ខ្មែរ" }));
    expect(container.firstElementChild).toHaveAttribute("lang", "km");
    expect(
      screen.getByRole("link", { name: /តាមដានមាសរបស់អ្នក/ })
    ).toHaveAttribute("href", "/dashboard");
    expect(window.localStorage.getItem("goldkh.landing.lang")).toBe("km");
  });

  it("opens in Khmer for a returning Khmer reader", async () => {
    window.localStorage.setItem("goldkh.landing.lang", "km");
    const { container } = render(<Landing quote={quote} year={2026} />);
    await vi.waitFor(() =>
      expect(container.firstElementChild).toHaveAttribute("lang", "km")
    );
  });
});
