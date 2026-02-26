import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function GET() {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { configured: false },
      { status: 200 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulate/config`, {
    credentials: "include",
    headers: { ...headers },
  });
  const data = await res.json().catch(() => ({ configured: false }));
  if (!res.ok) {
    return NextResponse.json(
      data as { error?: string },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
