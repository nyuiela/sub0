import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { RegisterPayload, RegisterSuccessResponse } from "@/types/register.types";

const JWT_COOKIE_NAME = "sub0-auth-jwt";
const AUTH_ERROR = "Authentication required. Sign in with your wallet (Thirdweb).";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value ?? null;
  if (!jwt) {
    return NextResponse.json(
      { error: AUTH_ERROR },
      { status: 401 }
    );
  }

  let body: RegisterPayload;
  try {
    body = (await request.json()) as RegisterPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const url = `${base}/api/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      Cookie: `jwt=${jwt}`,
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json().catch(() => ({}))) as
    | RegisterSuccessResponse
    | { error?: string; message?: string; details?: unknown };

  if (!res.ok) {
    const message =
      (data as { error?: string }).error ??
      (data as { message?: string }).message ??
      `Registration failed: ${res.status}`;
    return NextResponse.json(
      { error: message },
      { status: res.status }
    );
  }

  return NextResponse.json(data as RegisterSuccessResponse, { status: 201 });
}
