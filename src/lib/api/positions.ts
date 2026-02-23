import type {
  Position,
  PositionListParams,
  PositionListResponse,
} from "@/types/position.types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export async function getPositions(
  params: PositionListParams = {}
): Promise<PositionListResponse> {
  const qs = new URLSearchParams();
  if (params.marketId != null && params.marketId !== "")
    qs.set("marketId", params.marketId);
  if (params.userId != null && params.userId !== "")
    qs.set("userId", params.userId);
  if (params.agentId != null && params.agentId !== "")
    qs.set("agentId", params.agentId);
  if (params.address != null && params.address !== "")
    qs.set("address", params.address);
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
  const url = `/api/positions${query ? `?${query}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({
    data: [],
    total: 0,
    limit,
    offset: params.offset ?? 0,
  }));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Positions fetch failed: ${res.status}`);
  }
  return data as PositionListResponse;
}

export async function getPosition(id: string): Promise<Position> {
  const res = await fetch(`/api/positions/${id}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Position fetch failed: ${res.status}`);
  }
  return data as Position;
}
