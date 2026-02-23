import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";
import type { AgentListResponse } from "@/types/agent.types";

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<AgentListResponse>({
      data: [],
      total: 0,
      limit: DEFAULT_LIMIT,
      offset: DEFAULT_OFFSET,
    });
  }
  const { searchParams } = new URL(request.url);
  const ownerId = searchParams.get("ownerId") ?? undefined;
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
  if (ownerId != null && ownerId !== "") qs.set("ownerId", ownerId);
  if (status != null && status !== "") qs.set("status", status);

  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/agents?${qs.toString()}`, {
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
      { error: err?.error ?? "Agents fetch failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as AgentListResponse);
}
