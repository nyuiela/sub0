import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

type SimulateExtendBody = {
  agentId?: string;
  additionalMinutes?: number;
};

export async function POST(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as SimulateExtendBody;
  const agentId = body?.agentId?.trim();
  if (!agentId) {
    return NextResponse.json({ error: "agentId is required" }, { status: 400 });
  }
  const authHeaders = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulate/extend`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    credentials: "include",
    body: JSON.stringify({ agentId, additionalMinutes: body?.additionalMinutes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data as { error?: string }, { status: res.status });
  }
  return NextResponse.json(data);
}
