import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { MarketHoldersResponse } from "@/types/activity.types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<MarketHoldersResponse>({ data: [] });
  }
  const res = await fetch(`${base}/api/markets/${id}/holders`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({ data: [] }));
  if (res.status === 404 || !res.ok) {
    return NextResponse.json<MarketHoldersResponse>({ data: [] });
  }
  return NextResponse.json(data as MarketHoldersResponse);
}
