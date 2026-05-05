import { test, expect } from "@playwright/test";
import { injectSession, seedProviderEvents } from "./fixtures";

// T047: E2E test for Google provider (FR-018, SC-006)
// Confirms the full stack — Postgres seed → session cookie → Next.js → FullCalendar render.

test("Google events appear in the unified week-view", async ({ page }) => {
  const events = [
    {
      id: "google:e2e-1",
      title: "E2E Google Meeting",
      provider: "google" as const,
      startIso: new Date(Date.now() + 3600 * 1000).toISOString(),
      endIso: new Date(Date.now() + 7200 * 1000).toISOString(),
    },
    {
      id: "google:e2e-2",
      title: "E2E Google Standup",
      provider: "google" as const,
      startIso: new Date(Date.now() + 86400 * 1000).toISOString(),
      endIso: new Date(Date.now() + 86400 * 1000 + 1800 * 1000).toISOString(),
    },
  ];

  const cleanup = await seedProviderEvents(events, "google");

  try {
    await injectSession(page, "google");
    await page.goto("/");

    // The landing page redirects to /calendar (Next.js (calendar) route group) when connected
    await page.waitForURL("**/calendar", { timeout: 10_000 });

    // FullCalendar renders events by their title as visible text in the grid
    await expect(page.getByText("E2E Google Meeting")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("E2E Google Standup")).toBeVisible({
      timeout: 5_000,
    });
  } finally {
    await cleanup();
  }
});
