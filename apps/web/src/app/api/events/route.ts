import { USER_ID } from "@/lib/db";
import { getOrFetchEvents, mergeProviderEvents } from "@/lib/events";
import { logCalendarLoad, logProviderError } from "@/lib/observability";
import { getSessionConnections } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const connections = await getSessionConnections();
  if (connections.length === 0) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
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

  const providerMeta = connections.map((conn, i) => {
    const result = results[i];
    return {
      provider: conn.provider,
      fetchedAt: result?.snapshot.fetchedAt.toISOString() ?? null,
      stale: result?.stale ?? true,
    };
  });

  const validSnapshots = results
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map((r) => r.snapshot);

  const events = mergeProviderEvents(validSnapshots);
  const hasStale = providerMeta.some((p) => p.stale);

  logCalendarLoad(
    Date.now() - start,
    events.length,
    connections.map((c) => c.provider),
  );

  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - 30);
  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + 90);

  const body = {
    events,
    meta: {
      windowStart: windowStart.toISOString().split("T")[0],
      windowEnd: windowEnd.toISOString().split("T")[0],
      providers: providerMeta,
    },
  };

  return NextResponse.json(body, { status: hasStale ? 206 : 200 });
}
