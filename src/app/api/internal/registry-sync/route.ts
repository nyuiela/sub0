/**
 * Server-side proxy for POST /api/internal/registry-sync.
 * Injects the backend API key from server-side env before forwarding.
 * CRE workflows can hit this Next.js endpoint without exposing the API key client-side.
 */
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend not configured" }, { status: 503 });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => ({})) as unknown;
  const res = await fetch(`${backendUrl}/api/internal/registry-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!res) {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }

  const data = await res.json().catch(() => ({})) as unknown;
  return NextResponse.json(data, { status: res.status });
}
