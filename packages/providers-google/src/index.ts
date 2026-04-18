import type { UnifiedEvent } from "@unified-calendar/domain";

export interface GoogleEventInput {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  attendees?: Array<{ email: string; displayName?: string }>;
}

export interface FetchWindow {
  start: Date;
  end: Date;
}

export function normalizeGoogleEvent(
  input: GoogleEventInput,
  calendarId = "primary",
): UnifiedEvent {
  const allDay = Boolean(input.start.date && !input.start.dateTime);
  const startIso = input.start.dateTime ?? input.start.date ?? "";
  const endIso = input.end.dateTime ?? input.end.date ?? "";
  return {
    id: `google:${input.id}`,
    sourceProvider: "google",
    sourceCalendarId: calendarId,
    title: input.summary,
    startIso,
    endIso,
    allDay,
  };
}

export async function fetchGoogleEvents(
  _token: string,
  _window: FetchWindow,
): Promise<UnifiedEvent[]> {
  return [];
}
