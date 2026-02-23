import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";
import type { AgentTrackListResponse } from "@/types/agent.types";

const MAX_LIMIT = 365;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const limit =
    limitParam != null
      ? Math.min(MAX_LIMIT, Math.max(1, Number(limitParam))) || 90
      : 90;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (from != null && from !== "") qs.set("from", from);
  if (to != null && to !== "") qs.set("to", to);

  const headers = await getBackendAuthHeaders();
  const res = await fetch(
    `${base}/api/agents/${encodeURIComponent(id)}/tracks?${qs.toString()}`,
    {
      headers: { ...headers },
    }
  );
  const data = await res.json().catch(() => ({ data: [] }));
  if (!res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? "Agent tracks fetch failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as AgentTrackListResponse);
}
