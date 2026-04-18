import { render } from "@testing-library/react";
import type { CalendarSource, UnifiedEvent } from "@unified-calendar/domain";
import { describe, expect, it, vi } from "vitest";
import { WeekView } from "./WeekView";

const mockedEvents: { events: unknown[] }[] = [];

vi.mock("@fullcalendar/react", () => ({
  default: vi.fn((props: { events: unknown[] }) => {
    mockedEvents.push(props);
    return (
      <div data-testid="fullcalendar" data-event-count={props.events.length} />
    );
  }),
}));

vi.mock("@fullcalendar/timegrid", () => ({ default: {} }));

const defaultSources: CalendarSource[] = [
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
    visible: true,
  },
];

vi.mock("./CalendarContext", () => ({
  useCalendarContext: vi.fn(() => ({
    calendarSources: defaultSources,
    toggleVisibility: vi.fn(),
  })),
}));

const makeEvent = (
  id: string,
  provider: "google" | "microsoft" = "google",
): UnifiedEvent => ({
  id,
  sourceProvider: provider,
  sourceCalendarId: "primary",
  title: "Test Event",
  startIso: "2026-04-16T09:00:00Z",
  endIso: "2026-04-16T10:00:00Z",
  allDay: false,
});

describe("WeekView", () => {
  it("renders FullCalendar with visible events", () => {
    const { getByTestId } = render(
      <WeekView events={[makeEvent("google:g1"), makeEvent("google:g2")]} />,
    );
    expect(getByTestId("fullcalendar").getAttribute("data-event-count")).toBe(
      "2",
    );
  });

  it("renders with no events", () => {
    const { getByTestId } = render(<WeekView events={[]} />);
    expect(getByTestId("fullcalendar").getAttribute("data-event-count")).toBe(
      "0",
    );
  });

  it("filters out events from invisible sources", async () => {
    const { useCalendarContext } = await import("./CalendarContext");
    vi.mocked(useCalendarContext).mockReturnValueOnce({
      calendarSources: [
        {
          provider: "google",
          calendarId: "primary",
          name: "G",
          visible: false,
        },
        {
          provider: "microsoft",
          calendarId: "primary",
          name: "M",
          visible: true,
        },
      ],
      toggleVisibility: vi.fn(),
    });

    mockedEvents.length = 0;
    render(
      <WeekView
        events={[
          makeEvent("google:g1", "google"),
          makeEvent("microsoft:m1", "microsoft"),
        ]}
      />,
    );

    const lastCall = mockedEvents[mockedEvents.length - 1];
    expect(lastCall?.events).toHaveLength(1);
  });

  it("maps UnifiedEvent id and sourceProvider to extendedProps", () => {
    mockedEvents.length = 0;
    render(<WeekView events={[makeEvent("google:g1")]} />);

    const lastCall = mockedEvents[mockedEvents.length - 1];
    const mapped = lastCall?.events?.[0] as {
      id: string;
      extendedProps: { sourceProvider: string };
    };
    expect(mapped?.id).toBe("google:g1");
    expect(mapped?.extendedProps?.sourceProvider).toBe("google");
  });
});
