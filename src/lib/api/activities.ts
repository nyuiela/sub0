/**
 * Activities, holders and traders API client.
 */

import type {
  ActivitiesParams,
  ActivitiesResponse,
  MarketHoldersResponse,
  MarketTradersResponse,
} from "@/types/activity.types";

function buildActivitiesQuery(params: ActivitiesParams): string {
  const search = new URLSearchParams();
  if (params.marketId != null) search.set("marketId", params.marketId);
  if (params.userId != null) search.set("userId", params.userId);
  if (params.agentId != null) search.set("agentId", params.agentId);
  if (params.positionId != null) search.set("positionId", params.positionId);
  if (params.types != null) search.set("types", params.types);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function getActivities(
  params: ActivitiesParams = {}
): Promise<ActivitiesResponse> {
  const res = await fetch(`/api/activities${buildActivitiesQuery(params)}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Activities failed: ${res.status}`);
  }
  return data as ActivitiesResponse;
}

export async function getMarketHolders(marketId: string): Promise<MarketHoldersResponse> {
  const res = await fetch(`/api/markets/${encodeURIComponent(marketId)}/holders`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({ data: [] }));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Holders failed: ${res.status}`);
  }
  return data as MarketHoldersResponse;
}

export async function getMarketTraders(marketId: string): Promise<MarketTradersResponse> {
  const res = await fetch(`/api/markets/${encodeURIComponent(marketId)}/traders`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Traders failed: ${res.status}`);
  }
  return data as MarketTradersResponse;
}
