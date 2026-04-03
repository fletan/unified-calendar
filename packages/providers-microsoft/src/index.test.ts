import { describe, expect, it } from "vitest";
import { fetchMicrosoftEvents, normalizeMicrosoftEvent } from "./index";

describe("normalizeMicrosoftEvent", () => {
  it("maps microsoft fields to normalized shape", () => {
    const event = normalizeMicrosoftEvent({
      id: "m-1",
      subject: "Customer Call",
      start: "2026-03-27T11:00:00Z",
      end: "2026-03-27T11:30:00Z",
    });

    expect(event).toEqual({
      id: "m-1",
      title: "Customer Call",
      startIso: "2026-03-27T11:00:00Z",
      endIso: "2026-03-27T11:30:00Z",
      provider: "microsoft",
    });
  });

  it("returns empty fetch result in scaffold", async () => {
    await expect(fetchMicrosoftEvents()).resolves.toEqual([]);
  });
});
