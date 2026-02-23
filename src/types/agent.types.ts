/**
 * Agent API types – aligned with backend Agents API reference.
 * List/detail from GET /api/agents and GET /api/agents/:id.
 * encryptedPrivateKey is never returned (stripped server-side).
 * Numeric amounts from API are strings for precision; parsed to number in client for Agent type.
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
  currentExposure?: number;
  maxDrawdown?: number;
  winRate?: number;
  totalLlmTokens?: number;
  totalLlmCost?: number;
}

export interface AgentListParams {
  /** Only respected when using API key; ignored for JWT (owner-only list). */
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

/** GET /api/agents/public – basic fields only, no auth. */
export interface AgentPublic {
  id: string;
  name: string;
  status: AgentStatus;
  volume: string;
  trades: number;
  pnl: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPublicListParams {
  status?: AgentStatus;
  limit?: number;
  offset?: number;
}

export interface AgentPublicListResponse {
  data: AgentPublic[];
  total: number;
  limit: number;
  offset: number;
}

/** GET /api/agents/:id/tracks – time-series for charts. */
export interface AgentTrack {
  id: string;
  agentId: string;
  date: string;
  volume: string;
  trades: number;
  pnl: string;
  exposure: string;
  drawdown: string;
  llmTokensUsed: number;
  llmCost: string;
  createdAt: string;
}

export interface AgentTrackListParams {
  limit?: number;
  from?: string;
  to?: string;
}

export interface AgentTrackListResponse {
  data: AgentTrack[];
}

/** GET /api/agents/:id/reasoning – paginated reasoning logs. */
export interface AgentReasoning {
  id: string;
  agentId: string;
  marketId: string;
  model: string;
  userContext: string;
  reasoning: string;
  response: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: string;
  riskScore: number;
  actionTaken: string;
  createdAt: string;
}

export interface AgentReasoningListParams {
  limit?: number;
  offset?: number;
}

export interface AgentReasoningListResponse {
  data: AgentReasoning[];
  total: number;
  limit: number;
  offset: number;
}

/** POST /api/agents – create agent. */
export interface CreateAgentBody {
  ownerId: string;
  name: string;
  persona: string;
  publicKey: string;
  encryptedPrivateKey: string;
  modelSettings: Record<string, unknown>;
  templateId?: string;
}

/** PATCH /api/agents/:id – update agent (all fields optional). */
export interface UpdateAgentBody {
  name?: string;
  persona?: string;
  encryptedPrivateKey?: string;
  modelSettings?: Record<string, unknown>;
  status?: AgentStatus;
  templateId?: string | null;
}
