import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";
import type { Agent } from "@/types/agent.types";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/agents/${id}`, {
    credentials: "include",
    headers: { ...headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? "Agent fetch failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as Agent);
}
