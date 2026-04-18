import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarLoadingFallback } from "./CalendarLoadingFallback";

describe("CalendarLoadingFallback", () => {
  it("renders a loading placeholder", () => {
    render(<CalendarLoadingFallback />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("has an accessible label", () => {
    render(<CalendarLoadingFallback />);
    expect(screen.getByLabelText(/loading calendar/i)).toBeTruthy();
  });
});
