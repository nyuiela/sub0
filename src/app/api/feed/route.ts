import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { FeedResponse } from "@/types/feed.types";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<FeedResponse>({ data: [] });
  }
  const { searchParams } = new URL(request.url);
  const currencies = searchParams.get("currencies") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  const limitParam = searchParams.get("limit");
  const limit =
    limitParam != null
      ? Math.min(MAX_LIMIT, Math.max(1, Number(limitParam)) || DEFAULT_LIMIT)
      : DEFAULT_LIMIT;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (currencies != null && currencies !== "") qs.set("currencies", currencies);
  if (source != null && source !== "") qs.set("source", source);

  const res = await fetch(`${base}/api/feed?${qs.toString()}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({ data: [] }));
  if (!res.ok) {
    const err = data as { error?: string };
    return NextResponse.json(
      { error: err?.error ?? "Feed fetch failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as FeedResponse);
}
