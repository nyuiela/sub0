import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { CandlesResponse } from "@/types/chart.types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const interval = searchParams.get("interval") ?? "1m";
  const limit = searchParams.get("limit") ?? "100";
  const outcomeIndex = searchParams.get("outcomeIndex");
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<CandlesResponse>({ data: [] });
  }
  const qs = new URLSearchParams({ interval, limit });
  if (outcomeIndex != null && outcomeIndex !== "") qs.set("outcomeIndex", outcomeIndex);
  const url = `${base}/api/markets/${id}/candles?${qs.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 404 || !res.ok) {
    return NextResponse.json<CandlesResponse>({ data: [] });
  }
  const data = await res.json().catch(() => ({ data: [] }));
  return NextResponse.json(data as CandlesResponse);
}
