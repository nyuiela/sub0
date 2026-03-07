import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

type SimulateStopBody = {
  simulationId?: string;
  cancelled?: boolean;
};

export async function POST(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const body = (await request.json().catch(() => ({}))) as SimulateStopBody;
  const simulationId = body?.simulationId?.trim();
  if (!simulationId) {
    return NextResponse.json(
      { error: "simulationId is required" },
      { status: 400 }
    );
  }
  const authHeaders = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulate/stop`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    credentials: "include",
    body: JSON.stringify({
      simulationId,
      cancelled: Boolean(body?.cancelled),
    }),
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
