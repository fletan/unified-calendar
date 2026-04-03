export interface GoogleEventInput {
  id: string;
  summary: string;
  start: string;
  end: string;
}

export interface NormalizedGoogleEvent {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  provider: "google";
}

export function normalizeGoogleEvent(
  input: GoogleEventInput,
): NormalizedGoogleEvent {
  return {
    id: input.id,
    title: input.summary,
    startIso: input.start,
    endIso: input.end,
    provider: "google",
  };
}

export async function fetchGoogleEvents(): Promise<NormalizedGoogleEvent[]> {
  return [];
}
