/**
 * Server-side auth headers for proxying to backend (JWT from cookie).
 */

import { cookies } from "next/headers";

export const JWT_COOKIE_NAME = "sub0-auth-jwt";

/**
 * Parse JWT from a Cookie header string (e.g. from request.headers.get("cookie")).
 * Use this in Route Handlers to read auth from the incoming request directly.
 */
export function getJwtFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader?.trim()) return null;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name === JWT_COOKIE_NAME && value) return value;
    if (name === "jwt" && value) return value;
  }
  return null;
}

export async function getBackendAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(JWT_COOKIE_NAME)?.value ?? null;
  if (!jwt) return {};
  return buildBackendAuthHeaders(jwt);
}

/**
 * Build auth headers for the backend from a JWT string.
 * Use when you have the JWT from the request (e.g. getJwtFromCookieHeader).
 */
export function buildBackendAuthHeaders(jwt: string): Record<string, string> {
  return {
    Authorization: `Bearer ${jwt}`,
    Cookie: `${JWT_COOKIE_NAME}=${jwt}; jwt=${jwt}`,
  };
}

export function getBackendBase(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
}
