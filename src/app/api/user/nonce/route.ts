import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

/** GET /api/user/nonce – proxy to backend (user order nonce for EIP-712 UserTrade). */
export async function GET() {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json({ nonce: "0" });
  }
  const headers = await getBackendAuthHeaders();
  if (!headers.Authorization && !headers["x-api-key"]) {
    return NextResponse.json({ nonce: "0" });
  }
  try {
    const res = await fetch(`${base}/api/user/nonce`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...headers },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json({ nonce: "0" });
    const nonce = (data as { nonce?: string | number }).nonce;
    return NextResponse.json({
      nonce: nonce != null ? String(nonce) : "0",
    });
  } catch {
    return NextResponse.json({ nonce: "0" });
  }
}
