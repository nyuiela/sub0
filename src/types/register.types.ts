/**
 * Registration flow types for sub0 Web3 AI Agent platform.
 * Backend derives wallet address from Thirdweb JWT; no challenge/signing for register.
 */

export const AUTH_METHODS = ["WALLET", "SSO", "PASSKEY"] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export const PRIMARY_MISSIONS = [
  "market-analysis",
  "autonomous-trading",
  "yield-optimization",
] as const;
export type PrimaryMission = (typeof PRIMARY_MISSIONS)[number];

export interface UsernameAvailableResponse {
  available: boolean;
  username: string;
}

/** Max length for persona field (backend). */
export const PERSONA_MAX_LENGTH = 2000;

/** Strategy preference (backend StrategyPref). */
export const STRATEGY_PREFS = ["HYBRID", "AGGRESSIVE", "CONSERVATIVE"] as const;
export type StrategyPref = (typeof STRATEGY_PREFS)[number];

/** Optional strategy sent at register; backend may create AgentStrategy from this. */
export interface AgentStrategyPayload {
  preference?: StrategyPref;
  maxSlippage?: number;
  spreadTolerance?: number;
}

/** Create agent: name required; persona optional (max 2000); no keys from client. */
export interface AgentCreatePayload {
  name: string;
  persona?: string;
  strategy?: AgentStrategyPayload;
  modelSettings?: Record<string, unknown>;
}

/** Template agent: templateId + name required; persona optional; no keys from client. */
export interface AgentTemplatePayload {
  templateId: string;
  name: string;
  persona?: string;
  strategy?: AgentStrategyPayload;
  modelSettings?: Record<string, unknown>;
}

export type AgentRegisterPayload =
  | { create: AgentCreatePayload }
  | { template: AgentTemplatePayload };

/** Body for POST /api/register. Address comes from JWT on backend. */
export interface RegisterPayload {
  username: string;
  authMethod: AuthMethod;
  agent: AgentRegisterPayload;
  email?: string | null;
}

export interface RegisterSuccessResponse {
  user: Record<string, unknown>;
  agent: { id: string; name: string; status: string; templateId?: string };
}
