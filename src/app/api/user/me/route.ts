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
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const cookieHeader = request.headers.get("cookie");
  const jwtFromRequest = getJwtFromCookieHeader(cookieHeader);
  const headers = jwtFromRequest
    ? buildBackendAuthHeaders(jwtFromRequest)
    : await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/auth/me`, {
    method: "GET",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string; message?: string };
    return NextResponse.json(
      { error: err?.error ?? err?.message ?? "Failed to get current user" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
