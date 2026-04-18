import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { WeekView } from "./WeekView";
import type { UnifiedEvent } from "@unified-calendar/domain";

const mockedEvents: { events: unknown[] }[] = [];

vi.mock("@fullcalendar/react", () => ({
  default: vi.fn((props: { events: unknown[] }) => {
    mockedEvents.push(props);
    return <div data-testid="fullcalendar" data-event-count={props.events.length} />;
  }),
}));

vi.mock("@fullcalendar/timegrid", () => ({ default: {} }));

const makeEvent = (id: string): UnifiedEvent => ({
  id,
  sourceProvider: "google",
  sourceCalendarId: "primary",
  title: "Test Event",
  startIso: "2026-04-16T09:00:00Z",
  endIso: "2026-04-16T10:00:00Z",
  allDay: false,
});

describe("WeekView", () => {
  it("renders FullCalendar with mapped events", () => {
    const { getByTestId } = render(
      <WeekView events={[makeEvent("google:g1"), makeEvent("google:g2")]} />,
    );
    const cal = getByTestId("fullcalendar");
    expect(cal.getAttribute("data-event-count")).toBe("2");
  });

  it("renders with no events", () => {
    const { getByTestId } = render(<WeekView events={[]} />);
    expect(getByTestId("fullcalendar").getAttribute("data-event-count")).toBe("0");
  });

  it("maps UnifiedEvent id and sourceProvider to extendedProps", () => {
    mockedEvents.length = 0;
    render(<WeekView events={[makeEvent("google:g1")]} />);

    const lastCall = mockedEvents[mockedEvents.length - 1];
    const mapped = lastCall?.events?.[0] as {
      id: string;
      title: string;
      start: string;
      end: string;
      allDay: boolean;
      extendedProps: { sourceProvider: string };
    };
    expect(mapped?.id).toBe("google:g1");
    expect(mapped?.extendedProps?.sourceProvider).toBe("google");
  });
});
