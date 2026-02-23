import type { FeedResponse, FeedParams } from "@/types/feed.types";

export async function getFeed(params: FeedParams = {}): Promise<FeedResponse> {
  const qs = new URLSearchParams();
  if (params.currencies != null && params.currencies !== "")
    qs.set("currencies", params.currencies);
  if (params.limit != null) qs.set("limit", String(params.limit));
  if (params.source != null) qs.set("source", params.source);
  const query = qs.toString();
  const url = `/api/feed${query ? `?${query}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({ data: [] }));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Feed failed: ${res.status}`);
  }
  return data as FeedResponse;
}
