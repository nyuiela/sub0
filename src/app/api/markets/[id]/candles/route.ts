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
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<CandlesResponse>({ data: [] });
  }
  const url = `${base}/api/markets/${id}/candles?interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 404 || !res.ok) {
    return NextResponse.json<CandlesResponse>({ data: [] });
  }
  const data = await res.json().catch(() => ({ data: [] }));
  return NextResponse.json(data as CandlesResponse);
}
