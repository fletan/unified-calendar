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

export function isProvider(value: string): value is Provider {
  return value === "google" || value === "microsoft";
}
