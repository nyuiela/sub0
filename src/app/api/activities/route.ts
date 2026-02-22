import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { ActivitiesResponse } from "@/types/activity.types";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<ActivitiesResponse>(
      { data: [], total: 0, limit: DEFAULT_LIMIT, offset: DEFAULT_OFFSET }
    );
  }
  const { searchParams } = new URL(request.url);
  const marketId = searchParams.get("marketId") ?? undefined;
  const userId = searchParams.get("userId") ?? undefined;
  const agentId = searchParams.get("agentId") ?? undefined;
  const positionId = searchParams.get("positionId") ?? undefined;
  const types = searchParams.get("types") ?? undefined;
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam != null ? Math.min(MAX_LIMIT, Math.max(1, Number(limitParam))) || DEFAULT_LIMIT : DEFAULT_LIMIT;
  const offset = offsetParam != null ? Math.max(0, Number(offsetParam)) || DEFAULT_OFFSET : DEFAULT_OFFSET;

  const query = new URLSearchParams();
  if (marketId) query.set("marketId", marketId);
  if (userId) query.set("userId", userId);
  if (agentId) query.set("agentId", agentId);
  if (positionId) query.set("positionId", positionId);
  if (types) query.set("types", types);
  query.set("limit", String(limit));
  query.set("offset", String(offset));

  const res = await fetch(`${base}/api/activities?${query.toString()}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({ data: [], total: 0, limit, offset }));
  if (!res.ok) {
    const err = data as { error?: string; details?: unknown };
    return NextResponse.json(
      { error: err?.error ?? "Activities fetch failed", details: err?.details },
      { status: res.status }
    );
  }
  return NextResponse.json(data as ActivitiesResponse);
}
