import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function GET() {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { paymentRequired: false, paymentChainId: 84532 },
      { status: 200 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulate/payment-config`, {
    credentials: "include",
    headers: { ...headers },
  });
  const data = await res.json().catch(() => ({
    paymentRequired: false,
    paymentChainId: 84532,
  }));
  if (!res.ok) {
    return NextResponse.json(
      data as { error?: string },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
