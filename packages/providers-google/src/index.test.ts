import { describe, expect, it, vi } from "vitest";
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

  it("falls back to empty string when neither dateTime nor date is set", () => {
    const event = normalizeGoogleEvent({
      id: "g-x",
      summary: "X",
      start: {},
      end: {},
    });
    expect(event.startIso).toBe("");
    expect(event.endIso).toBe("");
    expect(event.allDay).toBe(false);
  });

  it("fetches and normalizes events from Google Calendar API", async () => {
    const mockItems = [
      {
        id: "evt-1",
        summary: "Stand-up",
        start: { dateTime: "2026-05-05T09:00:00Z" },
        end: { dateTime: "2026-05-05T09:30:00Z" },
      },
    ];

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ items: mockItems }),
      }),
    );

    const events = await fetchGoogleEvents("tok", {
      start: new Date("2026-05-01"),
      end: new Date("2026-05-31"),
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "google:evt-1",
      title: "Stand-up",
      sourceProvider: "google",
    });

    vi.unstubAllGlobals();
  });

  it("throws when the API returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    await expect(
      fetchGoogleEvents("bad-token", { start: new Date(), end: new Date() }),
    ).rejects.toThrow("Google Calendar API error: 401");

    vi.unstubAllGlobals();
  });

  it("returns empty array when API returns no items", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    const events = await fetchGoogleEvents("tok", {
      start: new Date(),
      end: new Date(),
    });

    expect(events).toEqual([]);
    vi.unstubAllGlobals();
  });
});
