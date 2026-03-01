import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function GET(
  _request: Request,
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
  if (!id?.trim()) {
    return NextResponse.json(
      { error: "Simulation id required" },
      { status: 400 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulations/${encodeURIComponent(id.trim())}`, {
    headers: { ...headers },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data as { error?: string }, { status: res.status });
  }
  return NextResponse.json(data);
}
