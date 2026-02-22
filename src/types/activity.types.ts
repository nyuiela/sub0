/**
 * Activities, holders and traders API types (md: activities-holders-traders).
 */

export type ActivityType = "trade" | "position" | "news" | "agent_activity";

export interface ActivityTradePayload {
  type: "trade";
  id: string;
  marketId: string;
  userId: string | null;
  agentId: string | null;
  side: "BID" | "ASK";
  amount: string;
  price: string;
  txHash: string | null;
  createdAt: string;
}

export interface ActivityPositionPayload {
  type: "position";
  id: string;
  marketId: string;
  userId: string | null;
  agentId: string | null;
  address: string;
  side: string;
  status: string;
  avgPrice: string;
  collateralLocked: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityNewsPayload {
  type: "news";
  id: string;
  marketId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  sourceUrl: string | null;
  createdAt: string;
}

export interface ActivityAgentPayload {
  type: "agent_activity";
  id: string;
  agentId: string;
  activityType: string;
  payload: unknown;
  createdAt: string;
}

export type ActivityPayload =
  | ActivityTradePayload
  | ActivityPositionPayload
  | ActivityNewsPayload
  | ActivityAgentPayload;

export interface ActivityItem {
  id: string;
  type: ActivityType;
  createdAt: string;
  payload: ActivityPayload;
}

export interface ActivitiesResponse {
  data: ActivityItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ActivitiesParams {
  marketId?: string;
  userId?: string;
  agentId?: string;
  positionId?: string;
  types?: string;
  limit?: number;
  offset?: number;
}

export interface MarketHolderItem {
  userId: string | null;
  agentId: string | null;
  address: string;
  positionCount: number;
  openPositionCount: number;
}

export interface MarketHoldersResponse {
  data: MarketHolderItem[];
}

export interface MarketTraderItem {
  userId: string | null;
  agentId: string | null;
  tradeCount: number;
  totalVolume: string;
}

export interface MarketTradersResponse {
  data: MarketTraderItem[];
}
