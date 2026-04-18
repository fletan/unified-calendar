import { describe, expect, it } from "vitest";
import { fetchMicrosoftEvents, normalizeMicrosoftEvent } from "./index";

describe("normalizeMicrosoftEvent", () => {
  it("maps a timed event to UnifiedEvent shape", () => {
    const event = normalizeMicrosoftEvent({
      id: "m-1",
      subject: "Customer Call",
      start: { dateTime: "2026-03-27T11:00:00Z", timeZone: "UTC" },
      end: { dateTime: "2026-03-27T11:30:00Z", timeZone: "UTC" },
      isAllDay: false,
    });

    expect(event).toEqual({
      id: "microsoft:m-1",
      sourceProvider: "microsoft",
      sourceCalendarId: "primary",
      title: "Customer Call",
      startIso: "2026-03-27T11:00:00Z",
      endIso: "2026-03-27T11:30:00Z",
      allDay: false,
    });
  });

  it("marks all-day events", () => {
    const event = normalizeMicrosoftEvent({
      id: "m-2",
      subject: "Holiday",
      start: { dateTime: "2026-04-01T00:00:00Z", timeZone: "UTC" },
      end: { dateTime: "2026-04-02T00:00:00Z", timeZone: "UTC" },
      isAllDay: true,
    });

    expect(event.allDay).toBe(true);
  });

  it("accepts a custom calendarId", () => {
    const event = normalizeMicrosoftEvent(
      {
        id: "m-3",
        subject: "Work Event",
        start: { dateTime: "2026-04-01T09:00:00Z", timeZone: "UTC" },
        end: { dateTime: "2026-04-01T10:00:00Z", timeZone: "UTC" },
        isAllDay: false,
      },
      "AAMkAGI2...",
    );

    expect(event.sourceCalendarId).toBe("AAMkAGI2...");
  });

  it("returns empty array from fetchMicrosoftEvents stub", async () => {
    await expect(
      fetchMicrosoftEvents("token", { start: new Date(), end: new Date() }),
    ).resolves.toEqual([]);
  });
});
