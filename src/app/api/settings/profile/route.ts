import { NextResponse } from "next/server";
import { getBackendBase, getBackendAuthHeaders } from "@/lib/api/backendAuth";

const BACKEND_PATH = "/api/settings/profile";

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
      { error: err?.error ?? err?.message ?? "Failed to load profile" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const base = getBackendBase();
  if (!base) {
    return NextResponse.json(
      { error: "Backend not configured" },
      { status: 503 }
    );
  }
  const headers = await getBackendAuthHeaders();
  let body: string;
  try {
    body = await request.text();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
  const res = await fetch(`${base}${BACKEND_PATH}`, {
    method: "PATCH",
    headers: { ...headers, "Content-Type": "application/json" },
    body: body || "{}",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string; message?: string };
    return NextResponse.json(
      { error: err?.error ?? err?.message ?? "Failed to update profile" },
      { status: res.status }
    );
  }
  return NextResponse.json(data);
}
