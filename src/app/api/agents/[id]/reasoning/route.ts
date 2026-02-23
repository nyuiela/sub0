import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";
import type { AgentReasoningListResponse } from "@/types/agent.types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
  const offsetParam = searchParams.get("offset");
  const limit =
    limitParam != null
      ? Math.min(MAX_LIMIT, Math.max(1, Number(limitParam))) || DEFAULT_LIMIT
      : DEFAULT_LIMIT;
  const offset =
    offsetParam != null ? Math.max(0, Number(offsetParam)) : 0;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("offset", String(offset));

  const headers = await getBackendAuthHeaders();
  const res = await fetch(
    `${base}/api/agents/${encodeURIComponent(id)}/reasoning?${qs.toString()}`,
    {
      headers: { ...headers },
    }
  );
  const data = await res.json().catch(() => ({
    data: [],
    total: 0,
    limit,
    offset,
  }));
  if (!res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? "Agent reasoning fetch failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as AgentReasoningListResponse);
}
