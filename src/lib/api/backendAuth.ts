/**
 * Server-side auth headers for proxying to backend (JWT from cookie).
 */

import { cookies } from "next/headers";

const JWT_COOKIE_NAME = "sub0-auth-jwt";

export async function getBackendAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value ?? null;
  if (!jwt) return {};
  return {
    Authorization: `Bearer ${jwt}`,
    Cookie: `jwt=${jwt}`,
  };
}

export function getBackendBase(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
}
