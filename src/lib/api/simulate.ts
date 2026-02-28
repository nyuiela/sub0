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

export interface SimulatePaymentConfigResponse {
  paymentRequired: boolean;
  paymentChainId: number;
}

export async function getSimulatePaymentConfig(): Promise<SimulatePaymentConfigResponse> {
  const res = await fetch("/api/simulate/payment-config", { credentials: "include" });
  const data = (await res.json().catch(() => ({
    paymentRequired: false,
    paymentChainId: 84532,
  }))) as SimulatePaymentConfigResponse;
  if (!res.ok) {
    return { paymentRequired: false, paymentChainId: 84532 };
  }
  return data;
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

export interface SimulateStartParams {
  agentId: string;
  dateRange: { start: string; end: string };
  /** Cap number of markets to enqueue (default 100, max 500). */
  maxMarkets?: number;
  /** Duration in minutes for client-side countdown; backend does not enforce. */
  durationMinutes?: number;
}

export interface SimulateStartResponse {
  enqueued: number;
  jobIds: string[];
}

/**
 * Start simulation: discover markets in date range, enqueue for agent (tenderly), and trigger analysis.
 * Agent limits itself to information within the date range (as-of simulation).
 * When the backend requires x402 payment, pass a payment-enabled fetch (e.g. from wrapFetchWithPayment) so the client can pay and retry.
 */
export async function startSimulation(
  params: SimulateStartParams,
  options?: { fetch?: typeof globalThis.fetch }
): Promise<SimulateStartResponse> {
  const fetcher = options?.fetch ?? fetch;
  const res = await fetcher("/api/simulate/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(params),
  });
  const data = (await res.json().catch(() => ({}))) as SimulateStartResponse & {
    error?: string;
    message?: string;
  };
  if (!res.ok) {
    if (res.status === 402) {
      throw new Error("Payment required. Connect your wallet (Base Sepolia or Base) and try again.");
    }
    throw new Error(data?.error ?? "Start simulation failed");
  }
  if (data?.message?.toLowerCase().includes("x402")) {
    throw new Error(data.message);
  }
  return data as SimulateStartResponse;
}
