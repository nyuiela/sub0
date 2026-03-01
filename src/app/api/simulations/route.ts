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
  const res = await fetch(`${base}/api/simulations`, {
    headers: { ...headers },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data as { error?: string }, { status: res.status });
  }
  return NextResponse.json(data);
}
