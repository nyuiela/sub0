import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

type SimulateStartBody = {
  agentId?: string;
  dateRange?: { start?: string; end?: string };
  maxMarkets?: number;
  durationMinutes?: number;
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
  const authHeaders = await getBackendAuthHeaders();
  const paymentSignature = request.headers.get("payment-signature") ?? request.headers.get("x-payment") ?? undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...authHeaders,
  };
  if (paymentSignature) headers["payment-signature"] = paymentSignature;
  const res = await fetch(`${base}/api/simulate/start`, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({
      agentId,
      dateRange: { start: startStr, end: endStr },
      maxMarkets: body?.maxMarkets,
      durationMinutes: body?.durationMinutes,
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
