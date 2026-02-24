import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

const BACKEND_PATH = "/api/settings/vault/balance";

export async function GET() {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}${BACKEND_PATH}`, {
    cache: "no-store",
    headers: { ...headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string; message?: string };
    return NextResponse.json(
      { error: err?.error ?? err?.message ?? "Failed to load vault balance" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
