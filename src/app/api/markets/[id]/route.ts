import { NextResponse } from "next/server";
import { getBackendAuthHeaders, getBackendBase } from "@/lib/api/backendAuth";
import type { Market } from "@/types/market.types";
import type { UpdateMarketBody } from "@/types/market.types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = getBackendBase();
  const res = await fetch(`${base}/api/markets/${id}`, { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.error ?? "Market not found",
      { status: res.status }
    );
  }
  return NextResponse.json(data as Market);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getBackendAuthHeaders();
  if (!auth.Authorization) {
    return NextResponse.json(
      { error: "Authentication required. Sign in with your wallet (Thirdweb)." },
      { status: 401 }
    );
  }
  let body: UpdateMarketBody;
  try {
    body = (await request.json()) as UpdateMarketBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const base = getBackendBase();
  const res = await fetch(`${base}/api/markets/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...auth,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.error ?? "Update failed",
      { status: res.status }
    );
  }
  return NextResponse.json(data as Market);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await getBackendAuthHeaders();
  if (!auth.Authorization) {
    return NextResponse.json(
      { error: "Authentication required. Sign in with your wallet (Thirdweb)." },
      { status: 401 }
    );
  }
  const base = getBackendBase();
  const res = await fetch(`${base}/api/markets/${id}`, {
    method: "DELETE",
    headers: auth,
  });
  if (res.status === 204) return new NextResponse(null, { status: 204 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(
    data?.error ?? "Delete failed",
    { status: res.status }
  );
}
