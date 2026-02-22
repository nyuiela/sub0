import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type { MarketPricesResponse } from "@/types/prices.types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const quantity = searchParams.get("quantity") ?? "1";
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const url = `${base}/api/markets/${id}/prices?quantity=${encodeURIComponent(quantity)}`;
  const res = await fetch(url, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (res.status === 404 || !res.ok) {
    return NextResponse.json(
      (data as { error?: string }).error ?? "Market not found",
      { status: res.status }
    );
  }
  return NextResponse.json(data as MarketPricesResponse);
}
