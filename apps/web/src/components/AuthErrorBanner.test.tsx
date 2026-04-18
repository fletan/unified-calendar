import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthErrorBanner } from "./AuthErrorBanner";

describe("AuthErrorBanner", () => {
  it("renders nothing when failures is empty", () => {
    const { container } = render(<AuthErrorBanner failures={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a banner for a google failure", () => {
    render(
      <AuthErrorBanner
        failures={[{ provider: "google", retryHref: "/api/auth/google" }]}
      />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/Google/i)).toBeTruthy();
    const link = screen.getByRole("link", { name: /retry/i });
    expect(link.getAttribute("href")).toBe("/api/auth/google");
  });

  it("renders a banner for a microsoft failure", () => {
    render(
      <AuthErrorBanner
        failures={[{ provider: "microsoft", retryHref: "/api/auth/microsoft" }]}
      />,
    );
    expect(screen.getByText(/Microsoft/i)).toBeTruthy();
  });

  it("renders multiple banners", () => {
    render(
      <AuthErrorBanner
        failures={[
          { provider: "google", retryHref: "/api/auth/google" },
          { provider: "microsoft", retryHref: "/api/auth/microsoft" },
        ]}
      />,
    );
    expect(screen.getAllByRole("link", { name: /retry/i })).toHaveLength(2);
  });
});
