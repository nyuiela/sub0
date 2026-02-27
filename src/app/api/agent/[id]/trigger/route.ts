import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function POST(
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
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/agent/${encodeURIComponent(id)}/trigger`, {
    method: "POST",
    credentials: "include",
    headers: { ...headers },
  });
  const data = (await res.json().catch(() => ({}))) as {
    triggered?: number;
    jobIds?: string[];
    error?: string;
  };
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error ?? "Trigger failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
