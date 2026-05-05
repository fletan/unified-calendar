import { fireEvent, render, screen } from "@testing-library/react";
import type { CalendarSource } from "@unified-calendar/domain";
import { describe, expect, it, vi } from "vitest";
import { CalendarSidebar } from "./CalendarSidebar";

const mockToggle = vi.fn();

vi.mock("./CalendarContext", () => ({
  useCalendarContext: vi.fn(() => ({
    calendarSources: [
      {
        provider: "google",
        calendarId: "primary",
        name: "Google Cal",
        visible: true,
      },
      {
        provider: "microsoft",
        calendarId: "primary",
        name: "MS Cal",
        visible: false,
      },
    ] as CalendarSource[],
    toggleVisibility: mockToggle,
  })),
}));

describe("CalendarSidebar", () => {
  it("renders a list item per calendar source", () => {
    render(<CalendarSidebar />);
    expect(screen.getByLabelText("Google Cal")).toBeTruthy();
    expect(screen.getByLabelText("MS Cal")).toBeTruthy();
  });

  it("renders checked checkbox for visible source", () => {
    render(<CalendarSidebar />);
    const googleCb = screen.getByLabelText("Google Cal") as HTMLInputElement;
    expect(googleCb.checked).toBe(true);
  });

  it("renders unchecked checkbox for hidden source", () => {
    render(<CalendarSidebar />);
    const msCb = screen.getByLabelText("MS Cal") as HTMLInputElement;
    expect(msCb.checked).toBe(false);
  });

  it("calls toggleVisibility when checkbox changes", () => {
    render(<CalendarSidebar />);
    fireEvent.click(screen.getByLabelText("Google Cal"));
    expect(mockToggle).toHaveBeenCalledWith("google", "primary");
  });
});
