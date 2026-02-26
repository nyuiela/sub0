/**
 * Auth API client: current user (GET /api/auth/me).
 * Uses Next.js proxy /api/user/me -> backend /api/auth/me. Credentials: include.
 */

import type { CurrentUserResponse } from "@/types/settings.api.types";

const AUTH_ME_PATH = "/api/user/me";

export async function getCurrentUser(): Promise<CurrentUserResponse | null> {
  const res = await fetch(AUTH_ME_PATH, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (data == null) return null;
  if (typeof data === "object" && data !== null && "user" in data && data.user != null) {
    return data.user as CurrentUserResponse;
  }
  return data as CurrentUserResponse;
}
