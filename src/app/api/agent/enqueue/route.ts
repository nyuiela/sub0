import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function POST(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  let body: { marketId?: string; agentId?: string };
  try {
    body = (await request.json()) as { marketId?: string; agentId?: string };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  const { marketId, agentId } = body;
  if (!marketId || !agentId) {
    return NextResponse.json(
      { error: "marketId and agentId required" },
      { status: 400 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/agent/enqueue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ marketId, agentId }),
  });
  const data = (await res.json().catch(() => ({}))) as { jobId?: string; error?: string };
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.error ?? "Enqueue failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
