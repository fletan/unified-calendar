import type { Provider } from "@unified-calendar/domain";

export function logAuthEvent(
  provider: Provider,
  outcome: "success" | "failure",
  errorType?: string,
): void {
  console.log(
    JSON.stringify({
      event: "auth",
      provider,
      outcome,
      ...(errorType ? { errorType } : {}),
      ts: new Date().toISOString(),
    }),
  );
}

export function logCalendarLoad(
  durationMs: number,
  eventCount: number,
  providers: Provider[],
): void {
  console.log(
    JSON.stringify({
      event: "calendar_load",
      durationMs,
      eventCount,
      providers,
      ts: new Date().toISOString(),
    }),
  );
}

export function logProviderError(
  provider: Provider,
  errorType: "fetch_failed" | "refresh_failed",
  detail?: string,
): void {
  console.log(
    JSON.stringify({
      event: "provider_error",
      provider,
      errorType,
      ...(detail ? { detail } : {}),
      ts: new Date().toISOString(),
    }),
  );
}
