/**
 * Simulate sandbox API: chain config, balance on Tenderly chain, funding eligibility, request fund.
 * Uses /api/simulate/* (proxied to backend). Backend reads Tenderly env (TENDERLY_VIRTUAL_TESTNET_RPC, etc.).
 */

export interface SimulateConfigResponse {
  configured: boolean;
  chainId?: number;
  name?: string;
  blockExplorerUrl?: string;
}

export interface SimulateBalanceResponse {
  nativeWei: string;
  usdcUnits: string;
  chainId?: number;
  walletAddress?: string;
  error?: string;
}

export interface SimulateEligibilityResponse {
  eligible: boolean;
  firstTime: boolean;
  nextRequestAt?: number;
  reason?: string;
}

export interface SimulateFundResponse {
  success: boolean;
  nativeTxHash?: string;
  usdcTxHash?: string;
  error?: string;
  nextRequestAt?: number;
}

export async function getSimulateConfig(): Promise<SimulateConfigResponse> {
  const res = await fetch("/api/simulate/config", { credentials: "include" });
  const data = (await res.json().catch(() => ({ configured: false }))) as SimulateConfigResponse;
  if (!res.ok) {
    return { configured: false };
  }
  return data;
}

export async function getSimulateBalance(
  agentId: string
): Promise<SimulateBalanceResponse> {
  const res = await fetch(
    `/api/simulate/balance?agentId=${encodeURIComponent(agentId)}`,
    { credentials: "include" }
  );
  const data = (await res.json().catch(() => ({}))) as SimulateBalanceResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error ?? `Balance fetch failed: ${res.status}`);
  }
  return data;
}

export async function getSimulateEligibility(
  agentId: string
): Promise<SimulateEligibilityResponse> {
  const res = await fetch(
    `/api/simulate/eligibility?agentId=${encodeURIComponent(agentId)}`,
    { credentials: "include" }
  );
  const data = (await res.json().catch(() => ({}))) as SimulateEligibilityResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data?.error ?? `Eligibility check failed: ${res.status}`);
  }
  return data;
}

export async function requestSimulateFund(
  agentId: string
): Promise<SimulateFundResponse> {
  const res = await fetch("/api/simulate/fund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ agentId }),
  });
  const data = (await res.json().catch(() => ({}))) as SimulateFundResponse;
  if (!res.ok) {
    throw new Error(data?.error ?? `Funding request failed: ${res.status}`);
  }
  return data;
}
