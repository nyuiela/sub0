/**
 * On-chain market registry API helper.
 * Calls the /api/internal/registry-sync endpoint and the existing markets list with onchain filters.
 * Used as a fallback or complement when the Prisma-backed REST endpoint may lag behind on-chain state.
 */

import type { Market } from "@/types/market.types";

const REGISTRY_SYNC_PATH = "/api/internal/registry-sync";

export interface OnchainMarketRecord {
  marketId: string;
  questionId?: string;
  txHash?: string;
  workflowRunId?: string;
  name?: string;
  status?: string;
  resolutionDate?: string;
}

export interface RegistrySyncPayload {
  markets: OnchainMarketRecord[];
  source?: string;
}

export interface RegistrySyncResponse {
  synced: number;
  source?: string;
}

/**
 * POST a registry-sync payload to the backend.
 * Used by the frontend when it receives REGISTRY_SYNC_UPDATE via WebSocket
 * to confirm the cache update and get synced count.
 */
export async function postRegistrySync(
  payload: RegistrySyncPayload
): Promise<RegistrySyncResponse> {
  const res = await fetch(REGISTRY_SYNC_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `registry-sync failed: ${res.status}`);
  }

  return res.json() as Promise<RegistrySyncResponse>;
}

/**
 * Fetch markets that have an onchainTxHash set (confirmed on-chain markets only).
 * Falls back to empty array on network errors rather than throwing to prevent
 * blocking the main markets view.
 */
export async function fetchOnchainConfirmedMarkets(): Promise<Market[]> {
  try {
    const res = await fetch("/api/markets?hasOnchainTxHash=true&limit=100", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json().catch(() => ({ markets: [] }))) as {
      markets?: Market[];
    };
    return data.markets ?? [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single market by questionId (used when registry-sync provides questionId but not marketId).
 * Returns null if not found rather than throwing.
 */
export async function fetchMarketByQuestionId(
  questionId: string
): Promise<Market | null> {
  try {
    const res = await fetch(
      `/api/markets?questionId=${encodeURIComponent(questionId)}&limit=1`,
      { credentials: "include", cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = (await res.json().catch(() => ({ markets: [] }))) as {
      markets?: Market[];
    };
    return data.markets?.[0] ?? null;
  } catch {
    return null;
  }
}
