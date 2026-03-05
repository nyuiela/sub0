/**
 * Strict TypeScript types for market WebSocket protocol (client <-> server).
 * Aligned with backend spec: md/websocket.integration.md
 */

export const WS_ROOM_MARKETS = "markets" as const;
export const WS_ROOM_PREFIX = "market:" as const;
export const WS_ROOM_AGENT_PREFIX = "agent:" as const;

/**
 * Enhanced room pattern helpers for the new WebSocket room system
 */

export function marketRoom(marketId: string): string {
  return `${WS_ROOM_PREFIX}${marketId}`;
}

export function marketActivityRoom(marketId: string): string {
  return `${WS_ROOM_PREFIX}${marketId}:activity`;
}

export function marketAiRoom(marketId: string): string {
  return `${WS_ROOM_PREFIX}${marketId}:ai`;
}

export function marketUserRoom(marketId: string, userId: string): string {
  return `${WS_ROOM_PREFIX}${marketId}:user:${userId}`;
}

export function marketAgentRoom(marketId: string, agentId: string): string {
  return `${WS_ROOM_PREFIX}${marketId}:agent:${agentId}`;
}

export function agentRoom(agentId: string): string {
  return `${WS_ROOM_AGENT_PREFIX}${agentId}`;
}

/** Server -> client: MARKET_UPDATED payload */
export type MarketUpdatedReason =
  | "created"
  | "updated"
  | "deleted"
  | "stats"
  | "position"
  | "orderbook"
  | "liquidity"
  | "resolved";

export interface MarketUpdatedPayload {
  marketId: string;
  reason?: MarketUpdatedReason;
  volume?: string;
  liquidity?: string;
  probability?: number;
  status?: string;
}

/** Server -> client: ORDER_BOOK_UPDATE level */
export interface OrderBookLevelPayload {
  price: string;
  quantity: string;
  orderCount?: number;
}

/** Server -> client: ORDER_BOOK_UPDATE payload */
export interface OrderBookUpdatePayload {
  marketId: string;
  bids: OrderBookLevelPayload[];
  asks: OrderBookLevelPayload[];
  timestamp: number;
}

/** Server -> client: TRADE_EXECUTED payload */
export interface TradeExecutedPayload {
  marketId: string;
  side: "long" | "short";
  size: string;
  price: string;
  executedAt: string;
  userId?: string;
  agentId?: string;
}

/** Server -> client: AGENT_UPDATED payload (room agent:{agentId}) */
export interface AgentUpdatedPayload {
  agentId: string;
  marketId?: string;
  balance?: string;
  pnl?: string;
  activePositions?: number;
  reason?: "balance" | "position" | "market_action" | "sync";
}

/** Server -> client: ACTIVITY_LOG payload */
export interface ActivityLogPayload {
  marketId: string;
  activityId: string;
  type: "trade" | "order" | "position" | "liquidity" | "agent" | "system";
  timestamp: string;
  actor?: {
    type: "user" | "agent" | "system";
    id?: string;
    name?: string;
  };
  summary: string;
  details?: Record<string, unknown>;
}

/** Server -> client: POSITION_UPDATED payload */
export interface PositionUpdatedPayload {
  positionId: string;
  marketId: string;
  userId?: string;
  agentId?: string;
  outcomeIndex: number;
  side: "long" | "short";
  size: string;
  avgPrice: string;
  pnl?: string;
  status: "open" | "closed" | "partial";
  updatedAt: string;
  reason: "created" | "increased" | "decreased" | "closed" | "liquidated";
}

/** Server -> client: USER_ASSET_CHANGED payload */
export interface UserAssetChangedPayload {
  userId: string;
  marketId: string;
  assetType: "collateral" | "position" | "pnl";
  change: string;
  newBalance: string;
  timestamp: string;
  reason: "trade" | "deposit" | "withdrawal" | "settlement" | "fee";
  txHash?: string;
}

/** Server -> client: AI_ANALYSIS_UPDATE payload */
export interface AIAnalysisUpdatePayload {
  marketId: string;
  analysisId: string;
  source: "gemini" | "grok" | "openwebui" | "system";
  timestamp: string;
  type: "sentiment" | "price_prediction" | "risk_assessment" | "market_summary";
  data: {
    sentiment?: "bullish" | "bearish" | "neutral";
    confidence?: number;
    priceTarget?: string;
    reasoning?: string;
    indicators?: Record<string, number | string>;
  };
  expiresAt?: string;
}

/** Server -> client: AGENT_MARKET_ACTION payload */
export interface AgentMarketActionPayload {
  marketId: string;
  agentId: string;
  actionId: string;
  timestamp: string;
  action: "analyze" | "bid" | "ask" | "trade" | "alert" | "rebalance";
  status: "pending" | "executed" | "failed" | "cancelled";
  details?: {
    orderId?: string;
    tradeId?: string;
    size?: string;
    price?: string;
    reasoning?: string;
  };
}

/** Server -> client: LMSR_PRICING_UPDATE payload */
export interface LmsrPricingUpdatePayload {
  marketId: string;
  questionId: string;
  outcomeIndex: number;
  quantity: string;
  tradeCostUsdc: string;
  deadline: string;
  nonce: string;
  donSignature: string;
  requestId: string;
  timestamp: string;
}

/** Server -> client: ERROR payload */
export interface WsErrorPayload {
  code: string;
  message: string;
}

/** Client -> server: SUBSCRIBE payload */
export interface SubscribePayload {
  room: string;
}

/** Client -> server: UNSUBSCRIBE payload */
export interface UnsubscribePayload {
  room: string;
}

/** Server -> client: inbound message type discriminator */
export type WsInboundMessageType =
  | "MARKET_UPDATED"
  | "ORDER_BOOK_UPDATE"
  | "TRADE_EXECUTED"
  | "ACTIVITY_LOG"
  | "POSITION_UPDATED"
  | "USER_ASSET_CHANGED"
  | "AI_ANALYSIS_UPDATE"
  | "AGENT_UPDATED"
  | "AGENT_MARKET_ACTION"
  | "LMSR_PRICING_UPDATE"
  | "PING"
  | "ERROR";

/** Typed inbound message envelope (after parsing JSON) */
export interface WsInboundMessage<T = unknown> {
  type: string;
  payload?: T;
  timestamp?: number;
}

/** Connection status for UI */
export type MarketSocketStatus = "idle" | "connecting" | "open" | "closed" | "error";

/** Throttle config for high-frequency events */
export const ORDER_BOOK_THROTTLE_MS = 100;
export const MAX_UPDATES_PER_SECOND = 10;
