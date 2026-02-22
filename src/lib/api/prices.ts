import type { MarketPricesResponse } from "@/types/prices.types";

export async function getMarketPrices(
  marketId: string,
  quantity?: string
): Promise<MarketPricesResponse> {
  const qs = quantity != null ? `?quantity=${encodeURIComponent(quantity)}` : "";
  const res = await fetch(`/api/markets/${encodeURIComponent(marketId)}/prices${qs}`, {
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Prices failed: ${res.status}`);
  }
  return data as MarketPricesResponse;
}
