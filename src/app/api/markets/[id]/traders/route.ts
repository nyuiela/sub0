import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { MarketTradersResponse } from "@/types/activity.types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<MarketTradersResponse>({ data: [] });
  }
  const res = await fetch(`${base}/api/markets/${id}/traders`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({ data: [] }));
  if (res.status === 404 || !res.ok) {
    return NextResponse.json<MarketTradersResponse>({ data: [] });
  }
  return NextResponse.json(data as MarketTradersResponse);
}
