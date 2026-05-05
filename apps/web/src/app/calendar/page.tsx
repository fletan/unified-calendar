import { CalendarContextProvider } from "@/components/CalendarContext";
import { CalendarLoadingFallback } from "@/components/CalendarLoadingFallback";
import { CalendarSidebar } from "@/components/CalendarSidebar";
import { ProviderBanner } from "@/components/ProviderBanner";
import { WeekView } from "@/components/WeekView";
import { USER_ID, getOrFetchEvents, mergeProviderEvents } from "@/lib/events";
import { logCalendarLoad, logProviderError } from "@/lib/observability";
import { getSessionConnections } from "@/lib/session";
import type { CalendarSource } from "@unified-calendar/domain";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function CalendarPage() {
  const connections = await getSessionConnections();

  if (connections.length === 0) {
    redirect("/");
  }

  const start = Date.now();
  const results = await Promise.all(
    connections.map((conn) =>
      getOrFetchEvents(USER_ID, conn.provider, conn).catch((err) => {
        logProviderError(conn.provider, "fetch_failed", String(err));
        return null;
      }),
    ),
  );

  const providerMeta = connections.map((conn, i) => ({
    provider: conn.provider,
    fetchedAt: results[i]?.snapshot.fetchedAt.toISOString() ?? null,
    stale: results[i]?.stale ?? true,
  }));

  const validSnapshots = results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((r) => r.snapshot);

  const events = mergeProviderEvents(validSnapshots);

  logCalendarLoad(
    Date.now() - start,
    events.length,
    connections.map((c) => c.provider),
  );

  const calendarSources: CalendarSource[] = connections.map((c) => ({
    provider: c.provider,
    calendarId: "primary",
    name: c.email,
    visible: true,
  }));

  return (
    <CalendarContextProvider initialSources={calendarSources}>
      <main style={{ display: "flex" }}>
        <CalendarSidebar />
        <div style={{ flex: 1 }}>
          <ProviderBanner providers={providerMeta} />
          <Suspense fallback={<CalendarLoadingFallback />}>
            <WeekView events={events} />
          </Suspense>
        </div>
      </main>
    </CalendarContextProvider>
  );
}
