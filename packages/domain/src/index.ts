export type Provider = "google" | "microsoft";

export interface UnifiedEvent {
  id: string;
  sourceProvider: Provider;
  sourceCalendarId: string;
  title: string;
  startIso: string;
  endIso: string;
  allDay: boolean;
}

export interface UserConnection {
  provider: Provider;
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface CalendarSource {
  provider: Provider;
  calendarId: string;
  name: string;
  visible: boolean;
}

export interface SyncSnapshot {
  userId: string;
  provider: Provider;
  events: UnifiedEvent[];
  fetchedAt: Date;
  windowStart: Date;
  windowEnd: Date;
}

export function isProvider(value: string): value is Provider {
  return value === "google" || value === "microsoft";
}
