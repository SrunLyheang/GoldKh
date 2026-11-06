// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthShell } from "./auth-shell";

describe("AuthShell", () => {
  it("renders the heading, subheading and form children", () => {
    render(
      <AuthShell heading="Welcome back!" subheading="Enter your login details">
        <button type="button">Log in</button>
      </AuthShell>,
    );

    expect(
      screen.getByRole("heading", { name: /welcome back/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/enter your login details/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in/i }),
    ).toBeInTheDocument();
  });
});
