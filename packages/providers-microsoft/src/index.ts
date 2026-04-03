export interface MicrosoftEventInput {
  id: string;
  subject: string;
  start: string;
  end: string;
}

export interface NormalizedMicrosoftEvent {
  id: string;
  title: string;
  startIso: string;
  endIso: string;
  provider: "microsoft";
}

export function normalizeMicrosoftEvent(
  input: MicrosoftEventInput,
): NormalizedMicrosoftEvent {
  return {
    id: input.id,
    title: input.subject,
    startIso: input.start,
    endIso: input.end,
    provider: "microsoft",
  };
}

export async function fetchMicrosoftEvents(): Promise<
  NormalizedMicrosoftEvent[]
> {
  return [];
}
