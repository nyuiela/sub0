import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get("limit") ?? "50";
  const offset = searchParams.get("offset") ?? "0";
  const qs = new URLSearchParams({ limit, offset }).toString();
  const headers = await getBackendAuthHeaders();
  const res = await fetch(
    `${base}/api/agents/${encodeURIComponent(id)}/enqueued-markets?${qs}`,
    { credentials: "include", headers: { ...headers } }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? "Enqueued markets fetch failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
