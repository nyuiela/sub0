/**
 * Strict TypeScript types for market WebSocket protocol (client <-> server).
 * Aligned with backend spec: md/websocket.integration.md
 */

export const WS_ROOM_MARKETS = "markets" as const;
export const WS_ROOM_PREFIX = "market:" as const;
export const WS_ROOM_AGENT_PREFIX = "agent:" as const;

export function marketRoom(marketId: string): string {
  return `${WS_ROOM_PREFIX}${marketId}`;
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
  | "orderbook";

export interface MarketUpdatedPayload {
  marketId: string;
  reason?: MarketUpdatedReason;
  volume?: string;
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
  balance?: string;
  reason?: "balance";
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
