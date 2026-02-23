/**
 * Agent API types – list and detail from GET /api/agents and GET /api/agents/:id.
 * encryptedPrivateKey is not returned (stripped server-side).
 */

export type AgentStatus = "ACTIVE" | "PAUSED" | "DEPLETED" | "EXPIRED";

export interface AgentOwner {
  id: string;
  address: string;
}

export interface AgentStrategy {
  preference?: string;
  maxSlippage?: number;
  spreadTolerance?: number;
}

export interface AgentTemplate {
  id: string;
  name: string;
}

export interface Agent {
  id: string;
  ownerId: string;
  name: string;
  persona: string | null;
  publicKey: string | null;
  balance: number;
  tradedAmount: number;
  totalTrades: number;
  pnl: number;
  status: AgentStatus;
  modelSettings: Record<string, unknown> | null;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
  owner: AgentOwner;
  strategy: AgentStrategy | null;
  template: AgentTemplate | null;
}

export interface AgentListParams {
  ownerId?: string;
  status?: AgentStatus;
  limit?: number;
  offset?: number;
}

export interface AgentListResponse {
  data: Agent[];
  total: number;
  limit: number;
  offset: number;
}
