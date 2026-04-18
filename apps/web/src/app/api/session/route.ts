import { NextResponse } from "next/server";
import { getSessionConnections } from "@/lib/session";

export async function GET(): Promise<NextResponse> {
  const connections = await getSessionConnections();
  return NextResponse.json({
    connections: connections.map(({ provider, email, expiresAt }) => ({
      provider,
      email,
      expiresAt,
    })),
  });
}
