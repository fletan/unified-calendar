import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { OnboardingPrompt } from "./OnboardingPrompt";

describe("OnboardingPrompt", () => {
  it("renders Google connect link", () => {
    render(<OnboardingPrompt />);
    const link = screen.getByRole("link", { name: /connect google/i });
    expect(link.getAttribute("href")).toBe("/api/auth/google");
  });

  it("renders Microsoft connect link", () => {
    render(<OnboardingPrompt />);
    const link = screen.getByRole("link", { name: /connect microsoft/i });
    expect(link.getAttribute("href")).toBe("/api/auth/microsoft");
  });
});
