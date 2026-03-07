import type { MarketPricesResponse } from "@/types/prices.types";

export interface PricingRequest {
  outcomeIndex: number;
  quantity: string;
  bParameter?: string;
}

export interface PricingResponse {
  success: boolean;
  requestId: string;
  error?: string;
}

/** Backend may return full quote in same response (sync). All fields optional except success/requestId. */
export interface PricingResponseWithQuote extends PricingResponse {
  marketId?: string;
  questionId?: string;
  outcomeIndex?: number;
  quantity?: string;
  tradeCostUsdc?: string;
  deadline?: string;
  nonce?: string;
  donSignature?: string;
  timestamp?: string;
}

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

export async function requestMarketPricing(
  marketId: string,
  params: PricingRequest
): Promise<PricingResponse> {
  const res = await fetch(`/api/markets/${encodeURIComponent(marketId)}/pricing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    throw new Error(err?.error ?? `Pricing request failed: ${res.status}`);
  }
  return data as PricingResponse;
}
