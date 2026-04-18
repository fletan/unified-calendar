import { redirect } from "next/navigation";
import { Suspense } from "react";
import { WeekView } from "@/components/WeekView";
import { ProviderBanner } from "@/components/ProviderBanner";
import { CalendarLoadingFallback } from "@/components/CalendarLoadingFallback";
import { CalendarContextProvider } from "@/components/CalendarContext";
import { CalendarSidebar } from "@/components/CalendarSidebar";
import { getSessionConnections } from "@/lib/session";
import type { CalendarSource } from "@unified-calendar/domain";

interface ProviderMeta {
  provider: "google" | "microsoft";
  fetchedAt: string | null;
  stale: boolean;
}

interface EventsResponse {
  events: Array<{
    id: string;
    sourceProvider: "google" | "microsoft";
    sourceCalendarId: string;
    title: string;
    startIso: string;
    endIso: string;
    allDay: boolean;
  }>;
  meta: {
    windowStart: string;
    windowEnd: string;
    providers: ProviderMeta[];
  };
}

async function getEvents(): Promise<EventsResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/api/events`,
      { cache: "no-store" },
    );
    if (res.status === 401) return null;
    return res.json() as Promise<EventsResponse>;
  } catch {
    return null;
  }
}

export default async function CalendarPage() {
  const [data, connections] = await Promise.all([
    getEvents(),
    getSessionConnections(),
  ]);

  if (!data) {
    redirect("/");
  }

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
          <ProviderBanner providers={data.meta.providers} />
          <Suspense fallback={<CalendarLoadingFallback />}>
            <WeekView events={data.events} />
          </Suspense>
        </div>
      </main>
    </CalendarContextProvider>
  );
}
