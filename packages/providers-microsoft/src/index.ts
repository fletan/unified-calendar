import type { UnifiedEvent } from "@unified-calendar/domain";

export interface MicrosoftEventInput {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  isAllDay: boolean;
  attendees?: Array<{ emailAddress: { address: string; name: string } }>;
  "@odata.nextLink"?: string;
}

export interface FetchWindow {
  start: Date;
  end: Date;
}

export function normalizeMicrosoftEvent(
  input: MicrosoftEventInput,
  calendarId = "primary",
): UnifiedEvent {
  return {
    id: `microsoft:${input.id}`,
    sourceProvider: "microsoft",
    sourceCalendarId: calendarId,
    title: input.subject,
    startIso: input.start.dateTime,
    endIso: input.end.dateTime,
    allDay: input.isAllDay,
  };
}

export async function fetchMicrosoftEvents(
  _token: string,
  _window: FetchWindow,
): Promise<UnifiedEvent[]> {
  return [];
}
