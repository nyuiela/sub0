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
}

export interface Position {
  id: string;
  marketId: string;
  userId: string | null;
  agentId: string | null;
  address: string;
  tokenAddress: string;
  outcomeIndex: number;
  side: PositionSide;
  status: PositionStatus;
  avgPrice: string;
  collateralLocked: string;
  isAmm: boolean;
  contractPositionId: string | null;
  createdAt: string;
  updatedAt: string;
  market: PositionMarket;
}

export interface PositionListParams {
  marketId?: string;
  userId?: string;
  agentId?: string;
  address?: string;
  status?: PositionStatus;
  limit?: number;
  offset?: number;
}

export interface PositionListResponse {
  data: Position[];
  total: number;
  limit: number;
  offset: number;
}
