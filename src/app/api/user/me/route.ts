import { NextRequest, NextResponse } from "next/server";
import {
  getBackendBase,
  getBackendAuthHeaders,
  getJwtFromCookieHeader,
  buildBackendAuthHeaders,
} from "@/lib/api/backendAuth";

/** GET /api/user/me – proxy to backend GET /api/auth/me (current user from JWT). */
export async function GET(request: NextRequest) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json({ user: null });
  }
  const cookieHeader = request.headers.get("cookie");
  const jwtFromRequest = getJwtFromCookieHeader(cookieHeader);
  const headers = jwtFromRequest
    ? buildBackendAuthHeaders(jwtFromRequest)
    : await getBackendAuthHeaders();
  let res: Response;
  try {
    res = await fetch(`${base}/api/auth/me`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json(data);
}
