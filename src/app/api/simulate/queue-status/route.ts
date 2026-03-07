import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

export async function GET() {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured", waiting: 0, active: 0, completed: 0, failed: 0 },
      { status: 503 }
    );
  }
  const headers = await getBackendAuthHeaders();
  const res = await fetch(`${base}/api/simulate/queue-status`, {
    credentials: "include",
    headers: { ...headers },
  });
  const data = (await res.json().catch(() => ({}))) as {
    waiting?: number;
    active?: number;
    completed?: number;
    failed?: number;
    error?: string;
  };
  if (!res.ok) {
    return NextResponse.json(
      {
        waiting: data?.waiting ?? 0,
        active: data?.active ?? 0,
        completed: data?.completed ?? 0,
        failed: data?.failed ?? 0,
        error: data?.error,
      },
      { status: res.status }
    );
  }
  return NextResponse.json({
    waiting: data?.waiting ?? 0,
    active: data?.active ?? 0,
    completed: data?.completed ?? 0,
    failed: data?.failed ?? 0,
  });
}
