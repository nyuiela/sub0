/**
 * Markets API client. Calls Next.js API routes which proxy to backend.
 */

import type {
  Market,
  MarketListParams,
  MarketListResponse,
  CreateMarketBody,
  UpdateMarketBody,
} from "@/types/market.types";

const API = "";

function buildQuery(params: MarketListParams): string {
  const search = new URLSearchParams();
  if (params.status != null) search.set("status", params.status);
  if (params.creatorAddress != null)
    search.set("creatorAddress", params.creatorAddress);
  if (params.platform != null) search.set("platform", params.platform);
  if (params.limit != null) search.set("limit", String(params.limit));
  if (params.offset != null) search.set("offset", String(params.offset));
  if (params.createdAtFrom != null) search.set("createdAtFrom", params.createdAtFrom);
  if (params.createdAtTo != null) search.set("createdAtTo", params.createdAtTo);
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listMarkets(
  params: MarketListParams = {}
): Promise<MarketListResponse> {
  const res = await fetch(`${API}/api/markets${buildQuery(params)}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Markets list failed: ${res.status}`
    );
  }
  return data as MarketListResponse;
}

export async function getMarketById(id: string): Promise<Market> {
  const res = await fetch(`${API}/api/markets/${encodeURIComponent(id)}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Market fetch failed: ${res.status}`
    );
  }
  return data as Market;
}

export async function getMarketByConditionId(
  conditionId: string
): Promise<Market> {
  const res = await fetch(
    `${API}/api/markets/condition/${encodeURIComponent(conditionId)}`,
    { credentials: "include" }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Market fetch failed: ${res.status}`
    );
  }
  return data as Market;
}

export async function createMarket(body: CreateMarketBody): Promise<Market> {
  const res = await fetch(`${API}/api/markets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Create market failed: ${res.status}`
    );
  }
  return data as Market;
}

export async function updateMarket(
  id: string,
  body: UpdateMarketBody
): Promise<Market> {
  const res = await fetch(`${API}/api/markets/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ?? `Update market failed: ${res.status}`
    );
  }
  return data as Market;
}

export async function deleteMarket(id: string): Promise<void> {
  const res = await fetch(`${API}/api/markets/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => ({}));
  throw new Error(
    (data as { error?: string }).error ?? `Delete market failed: ${res.status}`
  );
}
