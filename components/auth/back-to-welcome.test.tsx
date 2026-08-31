// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BackToWelcome } from "./back-to-welcome";

describe("BackToWelcome", () => {
  it("links back to the public landing page", () => {
    render(<BackToWelcome />);
    const link = screen.getByRole("link", { name: /return to welcome page/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
