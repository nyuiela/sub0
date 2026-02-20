"use server";

import { cookies } from "next/headers";
import type { LoginPayload } from "thirdweb/auth";
import { thirdwebAuth } from "@/lib/thirdweb/auth-server";
import type {
  RegisterPayload,
  RegisterSuccessResponse,
} from "@/types/register.types";

const JWT_COOKIE_NAME = "sub0-auth-jwt";
const JWT_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function generatePayload(params: { address: string }) {
  return thirdwebAuth.generatePayload(params);
}

export async function login(params: {
  payload: LoginPayload;
  signature: string;
}) {
  const verified = await thirdwebAuth.verifyPayload({
    payload: params.payload,
    signature: params.signature as `0x${string}`,
  });
  if (!verified.valid || !verified.payload) {
    return { success: false as const };
  }
  const jwt = await thirdwebAuth.generateJWT({ payload: verified.payload });
  const cookieStore = await cookies();
  cookieStore.set(JWT_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: JWT_MAX_AGE,
  });
  return { success: true as const };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
}

export async function isLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value;
  if (!jwt) return false;
  const { valid } = await thirdwebAuth.verifyJWT({ jwt });
  return valid;
}

export async function getAuthResult(jwt: string) {
  return thirdwebAuth.verifyJWT({ jwt });
}

export async function getSession() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value;
  if (!jwt) return null;
  const result = await thirdwebAuth.verifyJWT({ jwt });
  if (!result.valid || !("parsedJWT" in result)) return null;
  return { address: result.parsedJWT.sub };
}

export async function getJwtForBackend(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(JWT_COOKIE_NAME)?.value ?? null;
}

const DEFAULT_AUTH_ERROR =
  "Authentication required. Sign in with your wallet (Thirdweb).";

export type RegisterWithSessionResult =
  | { success: true; data: RegisterSuccessResponse }
  | { success: false; error: string };

export async function registerWithSession(
  payload: RegisterPayload
): Promise<RegisterWithSessionResult> {
  const jwt = await getJwtForBackend();
  if (!jwt) {
    return { success: false, error: DEFAULT_AUTH_ERROR };
  }
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  const url = `${base}/api/register`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const data = (await res.json().catch(() => ({}))) as
    | RegisterSuccessResponse
    | { error?: string; message?: string; details?: unknown };
  if (!res.ok) {
    const message =
      (data as { error?: string }).error ??
      (data as { message?: string }).message ??
      `Registration failed: ${res.status}`;
    return { success: false, error: message };
  }
  return { success: true, data: data as RegisterSuccessResponse };
}
