import type {
  Agent,
  AgentListParams,
  AgentListResponse,
  AgentPublic,
  AgentPublicListParams,
  AgentPublicListResponse,
  AgentTrack,
  AgentTrackListParams,
  AgentTrackListResponse,
  AgentReasoning,
  AgentReasoningListParams,
  AgentReasoningListResponse,
  CreateAgentBody,
  UpdateAgentBody,
} from "@/types/agent.types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_TRACK_LIMIT = 365;

/** Backend returns numeric amounts as strings; normalize to numbers for Agent type. */
function parseNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function normalizeAgent(raw: Record<string, unknown>): Agent {
  return {
    id: String(raw.id ?? ""),
    ownerId: String(raw.ownerId ?? ""),
    name: String(raw.name ?? ""),
    persona: raw.persona != null ? String(raw.persona) : null,
    publicKey: raw.publicKey != null ? String(raw.publicKey) : null,
    walletAddress:
      raw.walletAddress != null && String(raw.walletAddress).trim() !== ""
        ? String(raw.walletAddress).trim()
        : null,
    balance: parseNum(raw.balance),
    tradedAmount: parseNum(raw.tradedAmount),
    totalTrades: parseNum(raw.totalTrades),
    pnl: parseNum(raw.pnl),
    status: (raw.status as Agent["status"]) ?? "ACTIVE",
    modelSettings:
      raw.modelSettings != null && typeof raw.modelSettings === "object"
        ? (raw.modelSettings as Record<string, unknown>)
        : null,
    templateId: raw.templateId != null ? String(raw.templateId) : null,
    createdAt: String(raw.createdAt ?? ""),
    updatedAt: String(raw.updatedAt ?? ""),
    owner:
      typeof raw.owner === "string"
        ? raw.owner.trim()
        : raw.owner != null && typeof raw.owner === "object" && !Array.isArray(raw.owner)
          ? String((raw.owner as Record<string, unknown>).address ?? "").trim()
          : "",
    strategy:
      raw.strategy != null && typeof raw.strategy === "object"
        ? (raw.strategy as Agent["strategy"])
        : null,
    template:
      raw.template != null && typeof raw.template === "object"
        ? (raw.template as Agent["template"])
        : null,
    currentExposure: raw.currentExposure != null ? parseNum(raw.currentExposure) : undefined,
    maxDrawdown: raw.maxDrawdown != null ? parseNum(raw.maxDrawdown) : undefined,
    winRate: raw.winRate != null ? parseNum(raw.winRate) : undefined,
    totalLlmTokens: raw.totalLlmTokens != null ? parseNum(raw.totalLlmTokens) : undefined,
    totalLlmCost: raw.totalLlmCost != null ? parseNum(raw.totalLlmCost) : undefined,
    enqueuedMarketIds: Array.isArray(raw.enqueuedMarketIds)
      ? (raw.enqueuedMarketIds as unknown[]).map((id) => String(id)).filter(Boolean)
      : undefined,
  };
}

/**
 * List current user's agents (authenticated). Uses GET /api/agents with credentials.
 * Use for settings and account-scoped lists.
 */
export async function getMyAgents(
  params: AgentListParams = {}
): Promise<AgentListResponse> {
  const qs = new URLSearchParams();
  if (params.status != null)
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
  const data = (await res.json().catch(() => ({
    data: [],
    total: 0,
    limit,
    offset: params.offset ?? 0,
  }))) as { data?: unknown[]; total?: number; limit?: number; offset?: number };
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `My agents fetch failed: ${res.status}`);
  }
  const list = Array.isArray(data.data) ? data.data : [];
  return {
    data: list.map((item) => normalizeAgent(item as Record<string, unknown>)),
    total: Number(data.total) ?? 0,
    limit: Number(data.limit) ?? limit,
    offset: Number(data.offset) ?? params.offset ?? 0,
  };
}

/**
 * List agents (public). No auth; basic fields only. Use for main page listing.
 */
export async function getAgents(
  params: AgentListParams = {}
): Promise<AgentListResponse> {
  const qs = new URLSearchParams();
  if (params.ownerId != null && params.ownerId !== "")
    qs.set("ownerId", params.ownerId);
  if (params.status != null)
    qs.set("status", params.status);
  const limit =
    params.limit != null
      ? Math.min(MAX_LIMIT, Math.max(1, params.limit))
      : DEFAULT_LIMIT;
  qs.set("limit", String(limit));
  if (params.offset != null && params.offset > 0)
    qs.set("offset", String(params.offset));
  const query = qs.toString();
  const url = `/api/agents/public${query ? `?${query}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json().catch(() => ({
    data: [],
    total: 0,
    limit,
    offset: params.offset ?? 0,
  }))) as { data?: unknown[]; total?: number; limit?: number; offset?: number };
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Agents fetch failed: ${res.status}`);
  }
  const list = Array.isArray(data.data) ? data.data : [];
  return {
    data: list.map((item) => normalizeAgent(item as Record<string, unknown>)),
    total: Number(data.total) ?? 0,
    limit: Number(data.limit) ?? limit,
    offset: Number(data.offset) ?? params.offset ?? 0,
  };
}

/**
 * Get one agent (owner or API key). Returns full metrics.
 */
export async function getAgent(id: string): Promise<Agent> {
  const res = await fetch(`/api/agents/${id}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Agent fetch failed: ${res.status}`);
  }
  return normalizeAgent(data as Record<string, unknown>);
}

/**
 * List agents (public, no auth). Use for main page; returns basic fields only.
 */
export async function getAgentsPublic(
  params: AgentPublicListParams = {}
): Promise<AgentPublicListResponse> {
  const qs = new URLSearchParams();
  if (params.status != null)
    qs.set("status", params.status);
  const limit =
    params.limit != null
      ? Math.min(MAX_LIMIT, Math.max(1, params.limit))
      : DEFAULT_LIMIT;
  qs.set("limit", String(limit));
  if (params.offset != null && params.offset > 0)
    qs.set("offset", String(params.offset));
  const query = qs.toString();
  const url = `/api/agents/public${query ? `?${query}` : ""}`;
  const res = await fetch(url);
  const data = (await res.json().catch(() => ({
    data: [],
    total: 0,
    limit,
    offset: params.offset ?? 0,
  }))) as { data?: AgentPublic[]; total?: number; limit?: number; offset?: number };
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Public agents fetch failed: ${res.status}`);
  }
  return {
    data: Array.isArray(data.data) ? data.data : [],
    total: Number(data.total) ?? 0,
    limit: Number(data.limit) ?? limit,
    offset: Number(data.offset) ?? params.offset ?? 0,
  };
}

/**
 * Get agent tracks (time-series for charts). Owner or API key only.
 */
export async function getAgentTracks(
  agentId: string,
  params: AgentTrackListParams = {}
): Promise<AgentTrackListResponse> {
  const qs = new URLSearchParams();
  const limit =
    params.limit != null
      ? Math.min(MAX_TRACK_LIMIT, Math.max(1, params.limit))
      : 90;
  qs.set("limit", String(limit));
  if (params.from != null && params.from !== "") qs.set("from", params.from);
  if (params.to != null && params.to !== "") qs.set("to", params.to);
  const query = qs.toString();
  // const url = `/api/agents/${encodeURIComponent(agentId)}/tracks${query ? `?${query}` : ""}`;
  const url = `/api/agents/${encodeURIComponent(agentId)}/tracks`;
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json().catch(() => ({ data: [] }))) as {
    data?: AgentTrack[];
  };
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Agent tracks fetch failed: ${res.status}`);
  }
  return { data: Array.isArray(data.data) ? data.data : [] };
}

/**
 * Get agent reasoning logs (paginated). Owner or API key only.
 */
export async function getAgentReasoning(
  agentId: string,
  params: AgentReasoningListParams = {}
): Promise<AgentReasoningListResponse> {
  const qs = new URLSearchParams();
  const limit =
    params.limit != null
      ? Math.min(MAX_LIMIT, Math.max(1, params.limit))
      : DEFAULT_LIMIT;
  qs.set("limit", String(limit));
  if (params.offset != null && params.offset > 0)
    qs.set("offset", String(params.offset));
  const query = qs.toString();
  const url = `/api/agents/${encodeURIComponent(agentId)}/reasoning${query ? `?${query}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const data = (await res.json().catch(() => ({
    data: [],
    total: 0,
    limit,
    offset: params.offset ?? 0,
  }))) as AgentReasoningListResponse;
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Agent reasoning fetch failed: ${res.status}`);
  }
  return {
    data: Array.isArray(data.data) ? data.data : [],
    total: Number(data.total) ?? 0,
    limit: Number(data.limit) ?? limit,
    offset: Number(data.offset) ?? params.offset ?? 0,
  };
}

/**
 * Create an agent. With JWT, body ownerId must match authenticated user.
 */
export async function createAgent(body: CreateAgentBody): Promise<Agent> {
  const res = await fetch("/api/agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Create agent failed: ${res.status}`);
  }
  return normalizeAgent(data as Record<string, unknown>);
}

/**
 * Update an agent. Owner or API key only.
 */
export async function updateAgent(
  id: string,
  body: UpdateAgentBody
): Promise<Agent> {
  const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Update agent failed: ${res.status}`);
  }
  return normalizeAgent(data as Record<string, unknown>);
}

/**
 * Create agent wallet via CRE (createAgentKey). Use when agent has no walletAddress yet.
 * Returns updated agent with walletAddress set.
 */
export async function createAgentWallet(id: string): Promise<Agent> {
  const res = await fetch(`/api/agents/${encodeURIComponent(id)}/create-wallet`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string; detail?: string };
    throw new Error(err?.error ?? err?.detail ?? `Create wallet failed: ${res.status}`);
  }
  return normalizeAgent(data as Record<string, unknown>);
}

/**
 * Enqueue a market for an agent (add market to agent so agent trades on it).
 * Requires auth; agent must belong to current user.
 */
export async function enqueueAgentMarket(
  params: { marketId: string; agentId: string }
): Promise<{ jobId: string }> {
  const res = await fetch("/api/agent/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => ({}))) as { jobId?: string; error?: string };
  if (!res.ok) {
    throw new Error(data?.error ?? "Add to agent failed");
  }
  return { jobId: data.jobId ?? "" };
}

/**
 * Remove a market from an agent's enqueued list (stops showing "Added" for that market for this agent).
 * Requires auth; agent must belong to current user.
 */
export async function deleteAgentEnqueuedMarket(
  params: { marketId: string; agentId: string }
): Promise<void> {
  const res = await fetch("/api/agent/enqueue", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  if (!res.ok && res.status !== 204) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data?.error ?? "Remove from agent failed");
  }
}

/**
 * Delete an agent. Owner or API key only. Returns 204 no body.
 */
export async function deleteAgent(id: string): Promise<void> {
  const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Delete agent failed: ${res.status}`);
  }
}
