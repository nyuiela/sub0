import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { Market } from "@/types/market.types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ conditionId: string }> }
) {
  const { conditionId } = await params;
  const base = getBackendBase();
  const res = await fetch(
    `${base}/api/markets/condition/${encodeURIComponent(conditionId)}`,
    { credentials: "include" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.error ?? "Market not found",
      { status: res.status }
    );
  }
  return NextResponse.json(data as Market);
}
