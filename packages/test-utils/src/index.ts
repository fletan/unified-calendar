import type {
  CalendarSource,
  Provider,
  UnifiedEvent,
  UserConnection,
} from "@unified-calendar/domain";

export function expectNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export function makeUnifiedEvent(
  overrides: Partial<UnifiedEvent> = {},
): UnifiedEvent {
  return {
    id: "google:test-event-1",
    sourceProvider: "google",
    sourceCalendarId: "primary",
    title: "Test Event",
    startIso: "2026-04-16T09:00:00Z",
    endIso: "2026-04-16T10:00:00Z",
    allDay: false,
    ...overrides,
  };
}

export function makeUserConnection(
  overrides: Partial<UserConnection> = {},
): UserConnection {
  return {
    provider: "google",
    userId: "user-123",
    email: "test@example.com",
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

export function makeCalendarSource(
  overrides: Partial<CalendarSource> = {},
): CalendarSource {
  return {
    provider: "google",
    calendarId: "primary",
    name: "Test Calendar",
    visible: true,
    ...overrides,
  };
}

export function makeProviderPair(): {
  google: UserConnection;
  microsoft: UserConnection;
} {
  return {
    google: makeUserConnection({ provider: "google" }),
    microsoft: makeUserConnection({ provider: "microsoft" as Provider, email: "test@microsoft.com" }),
  };
}
