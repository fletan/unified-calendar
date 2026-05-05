import { test, expect } from "@playwright/test";
import { injectSession, seedProviderEvents } from "./fixtures";

// T048: E2E test for Microsoft provider (FR-018, SC-006)
// Confirms the full stack — Postgres seed → session cookie → Next.js → FullCalendar render.

test("Microsoft events appear in the unified week-view", async ({ page }) => {
  const events = [
    {
      id: "microsoft:e2e-1",
      title: "E2E Microsoft Review",
      provider: "microsoft" as const,
      startIso: new Date(Date.now() + 3600 * 1000).toISOString(),
      endIso: new Date(Date.now() + 7200 * 1000).toISOString(),
    },
    {
      id: "microsoft:e2e-2",
      title: "E2E Microsoft Planning",
      provider: "microsoft" as const,
      startIso: new Date(Date.now() + 86400 * 1000).toISOString(),
      endIso: new Date(Date.now() + 86400 * 1000 + 3600 * 1000).toISOString(),
    },
  ];

  const cleanup = await seedProviderEvents(events, "microsoft");

  try {
    await injectSession(page, "microsoft");
    await page.goto("/");

    // The landing page redirects to /calendar (Next.js (calendar) route group) when connected
    await page.waitForURL("**/calendar", { timeout: 10_000 });

    // FullCalendar renders events by their title as visible text in the grid
    await expect(page.getByText("E2E Microsoft Review")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("E2E Microsoft Planning")).toBeVisible({
      timeout: 5_000,
    });
  } finally {
    await cleanup();
  }
});
