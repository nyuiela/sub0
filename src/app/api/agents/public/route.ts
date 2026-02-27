import { NextResponse } from "next/server";
import { fetchFromBackend } from "@/lib/api/backendAuth";
import type { AgentListResponse } from "@/types/agent.types";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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
  if (status != null && status !== "") qs.set("status", status);

  const result = await fetchFromBackend(`/api/agents/public?${qs.toString()}`);
  const fallback: AgentListResponse = {
    data: [],
    total: 0,
    limit,
    offset,
  };
  if (!result.ok) {
    return NextResponse.json(fallback, { status: 503 });
  }
  const data = await result.res.json().catch(() => fallback);
  if (!result.res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? "Public agents fetch failed" },
      { status: result.res.status }
    );
  }
  return NextResponse.json((data ?? fallback) as AgentListResponse);
}
