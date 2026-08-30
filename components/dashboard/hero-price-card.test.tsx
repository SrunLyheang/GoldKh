// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { HeroPriceCard } from "./hero-price-card";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function renderCard(overrides: Partial<Parameters<typeof HeroPriceCard>[0]> = {}) {
  return render(
    <HeroPriceCard
      pricePerTroyOz="2345.6789"
      pricePerChi="282.1234"
      pricePerDamlung="2821.2340"
      capturedAt={new Date("2026-08-26T12:00:00Z")}
      isStale={false}
      refreshCooldownEndsAt={null}
      {...overrides}
    />
  );
}

describe("HeroPriceCard", () => {
  it("shows the damlung headline and secondary oz/chi figures", () => {
    renderCard();
    expect(screen.getByText("$2,821.23")).toBeInTheDocument();
    expect(screen.getByText(/\$2,345\.68\/oz/)).toBeInTheDocument();
    expect(screen.getByText(/\$282\.12\/chi/)).toBeInTheDocument();
  });

  it('labels a fresh price "Live"', () => {
    renderCard({ isStale: false });
    // The "[ ]" framing is pseudo-element content driven by theme tokens,
    // so it is not part of the DOM text — assert the word and timestamp.
    expect(screen.getByText("Live")).toBeInTheDocument();
    expect(screen.getByText(/as of/)).toBeInTheDocument();
  });

  it('labels a stale price "Stale", not "Live"', () => {
    renderCard({ isStale: true });
    expect(screen.getByText("Stale")).toBeInTheDocument();
    expect(screen.queryByText("Live")).not.toBeInTheDocument();
  });

  it("shows a market-closed note when the market is closed", () => {
    renderCard({ marketOpen: false });
    expect(
      screen.getByText("Market closed — prices resume Monday.")
    ).toBeInTheDocument();
  });

  it("shows no market-closed note while the market is open", () => {
    renderCard({ marketOpen: true });
    expect(
      screen.queryByText("Market closed — prices resume Monday.")
    ).not.toBeInTheDocument();
  });

  it("shows the spot-vs-retail-premium disclaimer", () => {
    renderCard();
    expect(
      screen.getByText(/price differently from the global spot rate/)
    ).toBeInTheDocument();
  });

  it("shows the chi headline and Damlung as the secondary figure when displayUnit is chi", () => {
    renderCard({ displayUnit: "chi", onDisplayUnitChange: vi.fn() });
    expect(screen.getByText("$282.12")).toBeInTheDocument();
    expect(screen.getByText(/\$2,821\.23\/damlung/)).toBeInTheDocument();
    expect(screen.getByText("Price per Chi")).toBeInTheDocument();
  });

  it("does not render the unit toggle when no onDisplayUnitChange handler is passed", () => {
    renderCard();
    expect(screen.queryByRole("group", { name: /display unit/i })).not.toBeInTheDocument();
  });

  it("calls onDisplayUnitChange when the Chi segment is clicked", async () => {
    const onDisplayUnitChange = vi.fn();
    const user = userEvent.setup();
    renderCard({ displayUnit: "damlung", onDisplayUnitChange });

    await user.click(screen.getByRole("button", { name: "Chi" }));

    expect(onDisplayUnitChange).toHaveBeenCalledWith("chi");
  });
});
