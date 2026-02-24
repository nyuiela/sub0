/**
 * Auth API client: current user (GET /auth/me).
 * Uses Next.js proxy /api/user/me -> backend /auth/me. Credentials: include.
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
  return data as CurrentUserResponse;
}
