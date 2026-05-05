import type { Provider, UserConnection } from "@unified-calendar/domain";
import { type SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";

interface SessionData {
  connections: UserConnection[];
}

const sessionOptions: SessionOptions = {
  cookieName: "unified_calendar_session",
  password: process.env.SESSION_PASSWORD ?? "",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getSessionConnections(): Promise<UserConnection[]> {
  const session = await getSession();
  return session.connections ?? [];
}

export async function setSessionConnection(
  conn: UserConnection,
): Promise<void> {
  const session = await getSession();
  const existing = session.connections ?? [];
  const filtered = existing.filter((c) => c.provider !== conn.provider);
  session.connections = [...filtered, conn];
  await session.save();
}

export async function removeSessionConnection(
  provider: Provider,
): Promise<void> {
  const session = await getSession();
  session.connections = (session.connections ?? []).filter(
    (c) => c.provider !== provider,
  );
  await session.save();
}
