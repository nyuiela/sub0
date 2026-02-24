/**
 * Settings API client: profile and vault.
 * Auth: JWT/session only (credentials: include). No API key.
 */

import type {
  ProfileResponse,
  ProfilePatchBody,
  VaultBalanceResponse,
  VaultActionResponse,
} from "@/types/settings.api.types";

const PROFILE_BASE = "/api/settings/profile";
const VAULT_BASE = "/api/settings/vault";

async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers:
      options.method === "PATCH" || options.method === "POST"
        ? { "Content-Type": "application/json", ...options.headers }
        : options.headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { error?: string })?.error ??
      (data as { message?: string })?.message ??
      `Request failed: ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

/**
 * GET /api/settings/profile – current user profile and summary stats.
 */
export async function getProfile(): Promise<ProfileResponse> {
  return fetchJson<ProfileResponse>(PROFILE_BASE);
}

/**
 * PATCH /api/settings/profile – update username, email.
 */
export async function updateProfile(
  body: ProfilePatchBody
): Promise<ProfileResponse> {
  return fetchJson<ProfileResponse>(PROFILE_BASE, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * GET /api/settings/vault/balance – current user vault USDC balance.
 */
export async function getVaultBalance(): Promise<VaultBalanceResponse> {
  return fetchJson<VaultBalanceResponse>(`${VAULT_BASE}/balance`);
}

/**
 * POST /api/settings/vault/deposit – deposit USDC. Returns new balance.
 */
export async function depositVault(amount: string): Promise<VaultActionResponse> {
  return fetchJson<VaultActionResponse>(`${VAULT_BASE}/deposit`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

/**
 * POST /api/settings/vault/withdraw – withdraw USDC. Returns new balance.
 */
export async function withdrawVault(
  amount: string
): Promise<VaultActionResponse> {
  return fetchJson<VaultActionResponse>(`${VAULT_BASE}/withdraw`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}
