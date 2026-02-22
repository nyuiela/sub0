/**
 * Order API types aligned with backend (md/order-trades.md).
 */

export type OrderSide = "BID" | "ASK";
export type OrderType = "LIMIT" | "MARKET" | "IOC";

export interface SubmitOrderBody {
  marketId: string;
  side: OrderSide;
  type: OrderType;
  price?: string | number;
  quantity: string | number;
  userId?: string;
  agentId?: string;
}

export interface OrderResponseTrade {
  id: string;
  marketId: string;
  price: string;
  quantity: string;
  makerOrderId: string;
  takerOrderId: string;
  side: "BID" | "ASK";
  userId: string | null;
  agentId: string | null;
  executedAt: number;
}

export interface OrderBookLevelPayload {
  price: string;
  quantity: string;
  orderCount?: number;
}

export interface OrderResponseSnapshot {
  marketId: string;
  bids: OrderBookLevelPayload[];
  asks: OrderBookLevelPayload[];
  timestamp: number;
}

export interface SubmitOrderResponse {
  orderId: string;
  trades: OrderResponseTrade[];
  snapshot: OrderResponseSnapshot;
}

export interface OrderErrorResponse {
  error: string;
  details?: unknown;
  message?: string;
}
