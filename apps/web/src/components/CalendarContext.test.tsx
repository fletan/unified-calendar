import { fireEvent, render, screen } from "@testing-library/react";
import type { CalendarSource } from "@unified-calendar/domain";
import { describe, expect, it } from "vitest";
import { CalendarContextProvider, useCalendarContext } from "./CalendarContext";

const initialSources: CalendarSource[] = [
  {
    provider: "google",
    calendarId: "primary",
    name: "Google Cal",
    visible: false,
  },
  {
    provider: "microsoft",
    calendarId: "primary",
    name: "MS Cal",
    visible: false,
  },
];

function ContextConsumer() {
  const { calendarSources, toggleVisibility } = useCalendarContext();
  return (
    <div>
      {calendarSources.map((s) => (
        <div key={`${s.provider}-${s.calendarId}`}>
          <span data-testid={`visible-${s.provider}`}>{String(s.visible)}</span>
          <button
            type="button"
            onClick={() => toggleVisibility(s.provider, s.calendarId)}
            data-testid={`toggle-${s.provider}`}
          >
            toggle
          </button>
        </div>
      ))}
    </div>
  );
}

describe("CalendarContext", () => {
  it("initializes all sources with visible=true regardless of input", () => {
    render(
      <CalendarContextProvider initialSources={initialSources}>
        <ContextConsumer />
      </CalendarContextProvider>,
    );
    expect(screen.getByTestId("visible-google").textContent).toBe("true");
    expect(screen.getByTestId("visible-microsoft").textContent).toBe("true");
  });

  it("toggles visibility when toggleVisibility is called", () => {
    render(
      <CalendarContextProvider initialSources={initialSources}>
        <ContextConsumer />
      </CalendarContextProvider>,
    );
    fireEvent.click(screen.getByTestId("toggle-google"));
    expect(screen.getByTestId("visible-google").textContent).toBe("false");
    expect(screen.getByTestId("visible-microsoft").textContent).toBe("true");
  });

  it("toggles back on second click", () => {
    render(
      <CalendarContextProvider initialSources={initialSources}>
        <ContextConsumer />
      </CalendarContextProvider>,
    );
    fireEvent.click(screen.getByTestId("toggle-google"));
    fireEvent.click(screen.getByTestId("toggle-google"));
    expect(screen.getByTestId("visible-google").textContent).toBe("true");
  });

  it("throws when used outside provider", () => {
    const originalError = console.error;
    console.error = () => {};
    expect(() => render(<ContextConsumer />)).toThrow();
    console.error = originalError;
  });
});
