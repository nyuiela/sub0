import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";
import type { PendingAgentTradesResponse } from "@/types/pending-trade.types";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<PendingAgentTradesResponse>({
      data: [],
      total: 0,
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
    });
  }
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit =
    limitParam != null
      ? Math.min(MAX_LIMIT, Math.max(1, Number(limitParam))) || DEFAULT_LIMIT
      : DEFAULT_LIMIT;
  const offset =
    offsetParam != null ? Math.max(0, Number(offsetParam)) || DEFAULT_OFFSET : DEFAULT_OFFSET;

  const query = new URLSearchParams();
  if (agentId) query.set("agentId", agentId);
  if (status) query.set("status", status);
  query.set("limit", String(limit));
  query.set("offset", String(offset));

  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/agent-pending-trades?${query.toString()}`, {
    headers: { ...headers, "Content-Type": "application/json" },
  });
  const data = await res.json().catch(() => ({ data: [], total: 0, limit, offset }));
  if (!res.ok) {
    const err = data as { error?: string; details?: unknown };
    return NextResponse.json(
      { error: err?.error ?? "Pending trades fetch failed", details: err?.details },
      { status: res.status }
    );
  }
  return NextResponse.json(data as PendingAgentTradesResponse);
}
