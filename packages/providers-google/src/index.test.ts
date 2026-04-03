import { describe, expect, it } from "vitest";
import { fetchGoogleEvents, normalizeGoogleEvent } from "./index";

describe("normalizeGoogleEvent", () => {
  it("maps google fields to normalized shape", () => {
    const event = normalizeGoogleEvent({
      id: "g-1",
      summary: "Team Sync",
      start: "2026-03-27T09:00:00Z",
      end: "2026-03-27T10:00:00Z",
    });

    expect(event).toEqual({
      id: "g-1",
      title: "Team Sync",
      startIso: "2026-03-27T09:00:00Z",
      endIso: "2026-03-27T10:00:00Z",
      provider: "google",
    });
  });

  it("returns empty fetch result in scaffold", async () => {
    await expect(fetchGoogleEvents()).resolves.toEqual([]);
  });
});
