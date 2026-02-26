/**
 * Agent pending trades API client (trades waiting for wallet or funds).
 */

import type {
  PendingAgentTradesParams,
  PendingAgentTradesResponse,
} from "@/types/pending-trade.types";

function buildQuery(params: PendingAgentTradesParams): string {
  const search = new URLSearchParams();
  if (params.agentId != null) search.set("agentId", params.agentId);
  if (params.status != null) search.set("status", params.status);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getAgentPendingTrades(
  params: PendingAgentTradesParams = {}
): Promise<PendingAgentTradesResponse> {
  const res = await fetch(`/api/agent-pending-trades${buildQuery(params)}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Pending trades failed: ${res.status}`);
  }
  return data as PendingAgentTradesResponse;
}
