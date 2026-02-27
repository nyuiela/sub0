/**
 * Orders API client. Calls Next.js POST /api/orders (proxies to backend with JWT).
 */

import type { SubmitOrderBody, SubmitOrderResponse, OrderErrorResponse } from "@/types/order.types";

/** GET /api/user/nonce – user order nonce for EIP-712 UserTrade. */
export async function getOrderNonce(): Promise<string> {
  const res = await fetch("/api/user/nonce", { credentials: "include", cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  const nonce = (data as { nonce?: string }).nonce;
  return nonce != null ? String(nonce) : "0";
}

export async function submitOrder(body: SubmitOrderBody): Promise<SubmitOrderResponse> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as OrderErrorResponse;
    throw new Error(err?.error ?? err?.message ?? `Order failed: ${res.status}`);
  }

  return data as SubmitOrderResponse;
}
