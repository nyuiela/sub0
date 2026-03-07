/**
 * Order API types aligned with backend (md/order-trades.md).
 */

/** CRE execution result stored on order and sent with trades (no signatures). */
export interface CrePayload {
  questionId?: string;
  outcomeIndex?: number;
  buy?: boolean;
  quantity?: string;
  tradeCostUsdc?: string;
  nonce?: string;
  deadline?: string;
  users?: string[];
  txHash?: string;
  txHashes?: string[];
  errors?: unknown[];
}

export type OrderSide = "BID" | "ASK";
export type OrderType = "LIMIT" | "MARKET" | "IOC";

export interface SubmitOrderBody {
  marketId: string;
  /** Index of the listed option (e.g. 0 = Yes, 1 = No). */
  outcomeIndex: number;
  side: OrderSide;
  type: OrderType;
  price?: string;
  quantity: string;
  userId?: string;
  agentId?: string;
  /** Required for user orders (no agentId): EIP-712 UserTrade signature (0x-prefixed hex). */
  userSignature?: string;
  /** Required for user orders: trade cost in USDC (decimal string), must match signed maxCostUsdc. */
  tradeCostUsdc?: bigint | number | string;
  /** Required for user orders: nonce used in the EIP-712 message. */
  nonce?: string;
  /** Required for user orders: EIP-712 deadline (unix timestamp string). */
  deadline?: string;
}

export interface OrderResponseTrade {
  id: string;
  marketId: string;
  outcomeIndex: number;
  price: string;
  quantity: string;
  makerOrderId: string;
  takerOrderId: string;
  side: "BID" | "ASK";
  userId: string | null;
  agentId: string | null;
  executedAt: number;
  /** On-chain transaction hash when available. */
  transactionHash?: string;
}

export interface OrderBookLevelPayload {
  price: string;
  quantity: string;
  orderCount?: number;
}

export interface OrderResponseSnapshot {
  marketId: string;
  outcomeIndex: number;
  bids: OrderBookLevelPayload[];
  asks: OrderBookLevelPayload[];
  timestamp: number;
}

export interface SubmitOrderResponse {
  orderId: string;
  trades: OrderResponseTrade[];
  snapshot: OrderResponseSnapshot;
  /** Transaction hash when backend supports it; show in success message with explorer link. */
  transactionHash?: string;
  /** CRE payload (txHash/txHashes, errors); stored in orders.crePayload. */
  crePayload?: CrePayload;
}

/** Resolve tx hash from order/crePayload for display. Use everywhere for consistent links. */
export function getOrderTransactionHash(response: SubmitOrderResponse | null | undefined): string | null {
  if (!response) return null;
  if (response.transactionHash) return response.transactionHash;
  const cp = response.crePayload;
  if (cp?.txHash) return cp.txHash;
  if (cp?.txHashes?.length) return cp.txHashes[0] ?? null;
  const first = response.trades?.[0];
  return first?.transactionHash ?? null;
}

/** Resolve tx hash from a CrePayload (trade or order). */
export function getTxHashFromCrePayload(crePayload: CrePayload | null | undefined): string | null {
  if (!crePayload) return null;
  if (crePayload.txHash) return crePayload.txHash;
  if (crePayload.txHashes?.length) return crePayload.txHashes[0] ?? null;
  return null;
}

export interface OrderErrorResponse {
  error: string;
  details?: unknown;
  message?: string;
}
