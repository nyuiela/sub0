/**
 * Market API and WebSocket types aligned with backend (backend-overview, market.api).
 */

export type MarketStatus = "OPEN" | "RESOLVING" | "CLOSED" | "DISPUTED";
export type MarketPlatform =
  | "NATIVE"
  | "POLYMARKET"
  | "KALSHI"
  | "MANIFOLD"
  | "OTHER";

export interface Market {
  id: string;
  name: string;
  creatorAddress: string;
  volume: string;
  context: string | null;
  imageUrl: string | null;
  outcomes: unknown[];
  sourceUrl: string | null;
  resolutionDate: string;
  oracleAddress: string;
  status: MarketStatus;
  collateralToken: string;
  conditionId: string;
  /** Bytes32 (hex) used for EIP-712 and contract; from backend. */
  questionId?: string;
  platform?: MarketPlatform;
  liquidity?: number | null;
  confidence?: number | null;
  pnl?: number | null;
  createdAt: string;
  updatedAt: string;
  totalVolume?: string;
  uniqueStakersCount?: number;
  lastTradeAt?: string | null;
  totalTrades?: number;
  activeOrderCount?: number;
  orderBookBidLiquidity?: string;
  orderBookAskLiquidity?: string;
  agentsEngagingCount?: number;
  newsCount?: number;
  positionIds?: string[];
  orderBookSnapshot?: OrderBookSnapshot;
  positions?: unknown[];
  orders?: unknown[];
  /** Outcome prices (0–1) when provided by list/detail API for card display. */
  outcomePrices?: string[];
}

export interface OrderBookLevel {
  price: string;
  quantity: string;
  orderCount?: number;
}

export interface OrderBookSnapshot {
  marketId: string;
  /** Index of the outcome (e.g. 0 = Yes, 1 = No). Omitted for legacy single-book responses. */
  outcomeIndex?: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export interface MarketListParams {
  status?: MarketStatus;
  creatorAddress?: string;
  platform?: MarketPlatform;
  limit?: number;
  offset?: number;
  /** ISO date; markets created on or after (Simulate date filter). */
  createdAtFrom?: string;
  /** ISO date; markets created before; agent info cutoff for Simulate. */
  createdAtTo?: string;
}

export interface MarketListResponse {
  data: Market[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateMarketBody {
  name: string;
  creatorAddress: string;
  context?: string;
  outcomes: unknown[];
  sourceUrl?: string;
  resolutionDate: string;
  oracleAddress: string;
  collateralToken: string;
  conditionId: string;
  platform?: MarketPlatform;
}

export interface UpdateMarketBody {
  name?: string;
  context?: string;
  outcomes?: unknown[];
  sourceUrl?: string | null;
  resolutionDate?: string;
  oracleAddress?: string;
  status?: MarketStatus;
  platform?: MarketPlatform;
  liquidity?: number | null;
  confidence?: number | null;
  pnl?: number | null;
}

/** WebSocket: ORDER_BOOK_UPDATE payload */
export interface OrderBookUpdatePayload {
  marketId: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

/** WebSocket: TRADE_EXECUTED payload */
export interface TradeExecutedPayload {
  marketId: string;
  side: "long" | "short";
  size: string;
  price: string;
  executedAt: string;
  userId?: string;
  agentId?: string;
}

/** WebSocket: MARKET_STATS_UPDATED payload (volume after trades or API create/update) */
export interface MarketStatsUpdatedPayload {
  marketId: string;
  volume: string;
}

export const WS_ROOM_PREFIX = "market:";

export function marketRoom(marketId: string): string {
  return `${WS_ROOM_PREFIX}${marketId}`;
}
