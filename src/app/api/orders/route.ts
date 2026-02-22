import { NextResponse } from "next/server";
import { getBackendAuthHeaders, getBackendBase } from "@/lib/api/backendAuth";
import type { SubmitOrderBody, SubmitOrderResponse, OrderErrorResponse } from "@/types/order.types";

function validateBody(body: unknown): body is SubmitOrderBody {
  if (body == null || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.marketId !== "string" || !b.marketId) return false;
  if (b.side !== "BID" && b.side !== "ASK") return false;
  if (b.type !== "LIMIT" && b.type !== "MARKET" && b.type !== "IOC") return false;
  if (b.quantity == null || (typeof b.quantity !== "string" && typeof b.quantity !== "number"))
    return false;
  if (b.type === "LIMIT" && b.price == null) return false;
  return true;
}

export async function POST(request: Request) {
  const auth = await getBackendAuthHeaders();
  if (!auth.Authorization && !auth["x-api-key"] && !auth["api-key"]) {
    return NextResponse.json<OrderErrorResponse>(
      { error: "Not authenticated. Sign in or provide API key." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<OrderErrorResponse>(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!validateBody(body)) {
    return NextResponse.json<OrderErrorResponse>(
      { error: "Validation failed", details: "marketId, side, type, quantity required; price required for LIMIT" },
      { status: 400 }
    );
  }

  const base = getBackendBase();
  if (!base) {
    return NextResponse.json<OrderErrorResponse>(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }

  const res = await fetch(`${base}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...auth,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = data as OrderErrorResponse;
    return NextResponse.json<OrderErrorResponse>(
      { error: err?.error ?? "Order failed", details: err?.details, message: err?.message },
      { status: res.status }
    );
  }

  return NextResponse.json(data as SubmitOrderResponse, { status: 201 });
}
