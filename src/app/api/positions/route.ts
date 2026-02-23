import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";
import type { PositionListResponse } from "@/types/position.types";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<PositionListResponse>({
      data: [],
      total: 0,
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
    });
  }
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get("marketId") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const agentId = searchParams.get("agentId") ?? undefined;
  const address = searchParams.get("address") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit =
    limitParam != null
      ? Math.min(MAX_LIMIT, Math.max(1, Number(limitParam))) || DEFAULT_LIMIT
      : DEFAULT_LIMIT;
  const offset =
    offsetParam != null
      ? Math.max(0, Number(offsetParam)) || DEFAULT_OFFSET
      : DEFAULT_OFFSET;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));
  if (marketId != null && marketId !== "") qs.set("marketId", marketId);
  if (userId != null && userId !== "") qs.set("userId", userId);
  if (agentId != null && agentId !== "") qs.set("agentId", agentId);
  if (address != null && address !== "") qs.set("address", address);
  if (status != null && status !== "") qs.set("status", status);

  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/positions?${qs.toString()}`, {
    credentials: "include",
    headers: { ...headers },
  });
  const data = await res.json().catch(() => ({
    data: [],
    total: 0,
    limit,
    offset,
  }));
  if (!res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? "Positions fetch failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as PositionListResponse);
}
