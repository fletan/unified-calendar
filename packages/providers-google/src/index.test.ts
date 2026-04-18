import { describe, expect, it } from "vitest";
import { fetchGoogleEvents, normalizeGoogleEvent } from "./index";

describe("normalizeGoogleEvent", () => {
  it("maps a timed event to UnifiedEvent shape", () => {
    const event = normalizeGoogleEvent({
      id: "g-1",
      summary: "Team Sync",
      start: { dateTime: "2026-03-27T09:00:00Z" },
      end: { dateTime: "2026-03-27T10:00:00Z" },
    });

    expect(event).toEqual({
      id: "google:g-1",
      sourceProvider: "google",
      sourceCalendarId: "primary",
      title: "Team Sync",
      startIso: "2026-03-27T09:00:00Z",
      endIso: "2026-03-27T10:00:00Z",
      allDay: false,
    });
  });

  it("marks all-day events when date (not dateTime) is set", () => {
    const event = normalizeGoogleEvent({
      id: "g-2",
      summary: "Holiday",
      start: { date: "2026-04-01" },
      end: { date: "2026-04-02" },
    });

    expect(event.allDay).toBe(true);
    expect(event.startIso).toBe("2026-04-01");
  });

  it("accepts a custom calendarId", () => {
    const event = normalizeGoogleEvent(
      {
        id: "g-3",
        summary: "Work Event",
        start: { dateTime: "2026-04-01T09:00:00Z" },
        end: { dateTime: "2026-04-01T10:00:00Z" },
      },
      "work@group.v.calendar.google.com",
    );

    expect(event.sourceCalendarId).toBe("work@group.v.calendar.google.com");
  });

  it("returns empty array from fetchGoogleEvents stub", async () => {
    await expect(
      fetchGoogleEvents("token", { start: new Date(), end: new Date() }),
    ).resolves.toEqual([]);
  });
});
