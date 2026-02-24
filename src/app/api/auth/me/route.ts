import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function GET() {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/auth/me`, {
    cache: "no-store",
    headers: { ...headers },
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
