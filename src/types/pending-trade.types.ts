/**
 * Agent pending trades (waiting for wallet or funds). Backend: GET /api/agent-pending-trades.
 */

export interface PendingAgentTradeItem {
  id: string;
  agentId: string;
  marketId: string;
  outcomeIndex: number;
  side: string;
  quantity: string;
  status: string;
  pendingReason: "NO_WALLET" | "INSUFFICIENT_BALANCE";
  orderId?: string;
  createdAt: string;
  fulfilledAt?: string;
  agent?: { id: string; name: string };
  market?: { id: string; name: string; outcomes: unknown };
}

export interface PendingAgentTradesResponse {
  data: PendingAgentTradeItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface PendingAgentTradesParams {
  agentId?: string;
  status?: "PENDING" | "FULFILLED" | "CANCELLED";
  limit?: number;
  offset?: number;
}
