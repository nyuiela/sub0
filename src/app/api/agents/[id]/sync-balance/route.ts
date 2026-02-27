import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

/**
 * Proxy POST /api/agents/:id/sync-balance to the backend.
 * Syncs agent wallet balance from chain and updates DB; broadcasts AGENT_UPDATED when changed.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/agents/${encodeURIComponent(id)}/sync-balance`, {
    method: "POST",
    headers: { ...headers },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string; detail?: string };
    return NextResponse.json(
      { error: err?.error ?? err?.detail ?? "Sync balance failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
