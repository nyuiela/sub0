/**
 * Register API client: username availability only.
 * Registration is done via server action registerWithSession (JWT from cookie).
 */

import type { UsernameAvailableResponse } from "@/types/register.types";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

export async function checkUsernameAvailable(
  username: string
): Promise<UsernameAvailableResponse> {
  const qs = `?${new URLSearchParams({ username })}`;
  const res = await fetch(`${BASE}/api/register/username/available${qs}`, {
    credentials: "include",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err?.message ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<UsernameAvailableResponse>;
}
