import type {
  Agent,
  AgentListParams,
  AgentListResponse,
} from "@/types/agent.types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getAgents(
  params: AgentListParams = {}
): Promise<AgentListResponse> {
  const qs = new URLSearchParams();
  if (params.ownerId != null && params.ownerId !== "")
    qs.set("ownerId", params.ownerId);
  if (params.status != null && params.status !== "")
    qs.set("status", params.status);
  const limit =
    params.limit != null
      ? Math.min(MAX_LIMIT, Math.max(1, params.limit))
      : DEFAULT_LIMIT;
  qs.set("limit", String(limit));
  if (params.offset != null && params.offset > 0)
    qs.set("offset", String(params.offset));
  const query = qs.toString();
  const url = `/api/agents${query ? `?${query}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({ data: [], total: 0, limit, offset: params.offset ?? 0 }));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Agents fetch failed: ${res.status}`);
  }
  return data as AgentListResponse;
}

export async function getAgent(id: string): Promise<Agent> {
  const res = await fetch(`/api/agents/${id}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Agent fetch failed: ${res.status}`);
  }
  return data as Agent;
}
