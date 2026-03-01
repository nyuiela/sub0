import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function POST(
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
  let body: { chainKey?: string; simulationId?: string } = {};
  try {
    const text = await request.text();
    if (text) body = (JSON.parse(text) as { chainKey?: string; simulationId?: string }) ?? {};
  } catch {
    // ignore
  }
  const headers = await getBackendAuthHeaders();
  const backendBody: { chainKey?: string; simulationId?: string } = {};
  if (body.chainKey === "main" || body.chainKey === "tenderly") backendBody.chainKey = body.chainKey;
  if (body.simulationId != null && body.simulationId !== "") backendBody.simulationId = body.simulationId;
  const res = await fetch(`${base}/api/agent/${encodeURIComponent(id)}/trigger`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(backendBody),
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
