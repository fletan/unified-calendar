import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProviderBanner } from "./ProviderBanner";

describe("ProviderBanner", () => {
  it("renders nothing when no providers are stale", () => {
    const { container } = render(
      <ProviderBanner
        providers={[
          { provider: "google", stale: false },
          { provider: "microsoft", stale: false },
        ]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders a warning for a stale google provider", () => {
    render(
      <ProviderBanner providers={[{ provider: "google", stale: true }]} />,
    );
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText(/Google/i)).toBeTruthy();
  });

  it("renders a warning for a stale microsoft provider", () => {
    render(
      <ProviderBanner providers={[{ provider: "microsoft", stale: true }]} />,
    );
    expect(screen.getByText(/Microsoft/i)).toBeTruthy();
  });

  it("only shows banners for stale providers", () => {
    render(
      <ProviderBanner
        providers={[
          { provider: "google", stale: true },
          { provider: "microsoft", stale: false },
        ]}
      />,
    );
    expect(screen.getByText(/Google/i)).toBeTruthy();
    expect(screen.queryByText(/Microsoft/i)).toBeNull();
  });
});
