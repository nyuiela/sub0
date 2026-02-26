import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function GET(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured", nativeWei: "0", usdcUnits: "0" },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId")?.trim();
  if (!agentId) {
    return NextResponse.json(
      { error: "agentId is required" },
      { status: 400 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulate/balance?agentId=${encodeURIComponent(agentId)}`, {
    credentials: "include",
    headers: { ...headers },
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
