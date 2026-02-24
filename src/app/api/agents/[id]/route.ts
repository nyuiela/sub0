import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";
import type { Agent } from "@/types/agent.types";

async function handleAgentRequest(
  id: string,
  method: "GET" | "PATCH",
  request?: Request
) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }
  const headers = await getBackendAuthHeaders();
  const init: RequestInit = {
    method,
    credentials: "include",
    headers: { ...headers },
  };
  if (method === "PATCH" && request) {
    try {
      init.body = await request.text();
      (init.headers as Record<string, string>)["Content-Type"] =
        request.headers.get("content-type") ?? "application/json";
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
  }
  const res = await fetch(`${base}/api/agents/${id}`, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? (method === "GET" ? "Agent fetch failed" : "Agent update failed") },
      { status: res.status }
    );
  }
  return NextResponse.json(data as Agent);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return handleAgentRequest(id, "GET");
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return handleAgentRequest(id, "PATCH", request);
}
