import { NextResponse } from "next/server";
import { getBackendBase } from "@/lib/api/backendAuth";
import type {
  CandlesResponse,
  BackendCandlesResponse,
  OHLCV,
} from "@/types/chart.types";

function parseNum(s: string | undefined): number {
  if (s == null || s === "") return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function backendCandlesToOHLCV(candles: BackendCandlesResponse["candles"]): OHLCV[] {
  return candles.map((c) => ({
    time: Math.floor(c.time / 1000),
    open: parseNum(c.open),
    high: parseNum(c.high),
    low: parseNum(c.low),
    close: parseNum(c.close),
    volume: c.volume != null ? parseNum(c.volume) : undefined,
  }));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const resolution = searchParams.get("resolution") ?? "1h";
  const limit = searchParams.get("limit") ?? "200";
  const outcomeIndex = searchParams.get("outcomeIndex");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const base = getBackendBase();
  if (!base) {
    if (process.env.NODE_ENV === "development") {
      console.info("[candles] No NEXT_PUBLIC_BACKEND_URL; returning empty data");
    }
    return NextResponse.json<CandlesResponse>({ data: [] });
  }
  const qs = new URLSearchParams({ resolution, limit });
  if (outcomeIndex != null && outcomeIndex !== "")
    qs.set("outcomeIndex", outcomeIndex);
  if (from != null && from !== "") qs.set("from", from);
  if (to != null && to !== "") qs.set("to", to);
  const url = `${base}/api/markets/${id}/candles?${qs.toString()}`;
  const res = await fetch(url, { credentials: "include" });
  if (res.status === 404 || !res.ok) {
    if (process.env.NODE_ENV === "development") {
      console.info(
        `[candles] ${id} outcomeIndex=${outcomeIndex ?? "none"} -> ${res.status} (no data)`
      );
    }
    return NextResponse.json<CandlesResponse>({ data: [] });
  }
  const raw = await res.json().catch(() => ({ marketId: id, candles: [] }));
  const backend = raw as BackendCandlesResponse;
  const candles = Array.isArray(backend.candles) ? backend.candles : [];
  const data = backendCandlesToOHLCV(candles);
  if (process.env.NODE_ENV === "development") {
    console.info(
      `[candles] ${id} outcomeIndex=${outcomeIndex ?? "none"} -> ${res.status} (${data.length} candles)`
    );
  }
  return NextResponse.json<CandlesResponse>({ data, resolution });
}
