import { NextResponse } from "next/server";
import { getSession } from "@/app/actions/auth";
import { getBackendBase } from "@/lib/api/backendAuth";

export type SessionResponse = { loggedIn: boolean; registered?: boolean };

export async function GET(): Promise<NextResponse<SessionResponse>> {
  const session = await getSession();
  if (!session?.address) {
    return NextResponse.json({ loggedIn: false });
  }
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json({
      loggedIn: true,
      registered: false,
    });
  }
  const address = encodeURIComponent(session.address);
  const res = await fetch(`${base}/api/users/address/${address}`, {
    cache: "no-store",
  });
  return NextResponse.json({
    loggedIn: true,
    registered: res.ok,
  });
}
