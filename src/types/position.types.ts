import type { CrePayload } from "./order.types";

/**
 * Positions API – GET /api/positions (list) and GET /api/positions/:id (detail).
 * Positions represent LONG or SHORT exposure in a market outcome.
 */

export type PositionSide = "LONG" | "SHORT";
export type PositionStatus = "OPEN" | "CLOSED" | "LIQUIDATED";

export interface PositionMarket {
  id: string;
  name: string;
  conditionId?: string;
  outcomes?: unknown[];  // Market outcomes array
}

export interface Position {
  id: string;
  marketId: string;
  userId: string | null;
  agentId: string | null;
  address: string;
  tokenAddress: string;
  outcomeIndex: number;
  outcomeString?: string;        // Human-readable outcome (e.g., "Yes", "No")
  side: PositionSide;
  status: PositionStatus;
  avgPrice: string;
  collateralLocked: string;
  isAmm: boolean;
  contractPositionId: string | null;
  chainKey?: string;             // "main" or "tenderly"
  createdAt: string;
  updatedAt: string;
  market: PositionMarket;
  /** Brief agent reason for this position (when requested with includeLatestReason). */
  lastReason?: string;
  /** Brief agent reason for this position (when requested with includeLatestReason). */
  tradeReason?: string;
  /** On-chain transaction hash when available (CRE/backend). */
  txHash?: string;
  /** CRE payload when available; use for tx link and errors. */
  crePayload?: CrePayload;
}

/** "main" = live; "tenderly" = simulate. Omit = main. */
export type PositionChainKey = "main" | "tenderly";

export interface PositionListParams {
  marketId?: string;
  userId?: string;
  agentId?: string;
  address?: string;
  status?: PositionStatus;
  /** Filter by chain: main (live) or tenderly (simulate). Omit = main. */
  chainKey?: PositionChainKey;
  /** Include brief agent reason per position (when agentId is set). */
  includeLatestReason?: boolean;
  limit?: number;
  offset?: number;
}

export interface PositionListResponse {
  data: Position[];
  total: number;
  limit: number;
  offset: number;
}
