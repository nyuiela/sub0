import { NextResponse } from "next/server";
import { getBackendAuthHeaders, getBackendBase } from "@/lib/api/backendAuth";
import type { MarketListResponse, Market } from "@/types/market.types";
import type { CreateMarketBody } from "@/types/market.types";

export async function GET(request: Request) {
  const base = getBackendBase();
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();
  const url = `${base}/api/markets${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.error ?? { error: "Markets request failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as MarketListResponse);
}

export async function POST(request: Request) {
  const auth = await getBackendAuthHeaders();
  if (!auth.Authorization) {
    return NextResponse.json(
      { error: "Authentication required. Sign in with your wallet (Thirdweb)." },
      { status: 401 }
    );
  }
  let body: CreateMarketBody;
  try {
    body = (await request.json()) as CreateMarketBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const base = getBackendBase();
  const res = await fetch(`${base}/api/markets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...auth,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.error ?? { error: "Create market failed" },
      { status: res.status }
    );
  }
  return NextResponse.json(data as Market, { status: 201 });
}
