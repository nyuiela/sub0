import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

type SimulateStartBody = {
  agentId?: string;
  dateRange?: { start?: string; end?: string };
};

export async function POST(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const body = (await request.json().catch(() => ({}))) as SimulateStartBody;
  const agentId = body?.agentId?.trim();
  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400 }
    );
  }
  const startStr = body?.dateRange?.start?.trim();
  const endStr = body?.dateRange?.end?.trim();
  if (!startStr || !endStr) {
    return NextResponse.json(
      { error: "dateRange.start and dateRange.end are required" },
      { status: 400 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulate/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    credentials: "include",
    body: JSON.stringify({ agentId, dateRange: { start: startStr, end: endStr } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data as { error?: string },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
