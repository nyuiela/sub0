import { z } from "zod";

// Trade types
export type TradeSide = "BID" | "ASK";

export interface Trade {
  id: string;
  marketId: string;
  outcomeIndex: number;
  userId?: string;
  agentId?: string;
  side: TradeSide;
  amount: string;
  price: string;
  chainKey?: string;
  createdAt: string;
  market: {
    id: string;
    name: string;
    outcomes: unknown[];
  };
  user?: {
    id: string;
    username?: string;
    address: string;
  };
  agent?: {
    id: string;
    name: string;
  };
}

export interface TradeListParams {
  marketId?: string;
  userId?: string;
  agentId?: string;
  limit?: number;
  offset?: number;
}

export interface TradeListResponse {
  data: Trade[];
  total: number;
  limit: number;
  offset: number;
}

// API client functions
export async function getTrades(params: TradeListParams = {}): Promise<TradeListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.marketId) searchParams.set('marketId', params.marketId);
  if (params.userId) searchParams.set('userId', params.userId);
  if (params.agentId) searchParams.set('agentId', params.agentId);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const response = await fetch(`/api/trades?${searchParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getTrade(id: string): Promise<Trade> {
  const response = await fetch(`/api/trades/${id}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Trade not found');
    }
    throw new Error(`Failed to fetch trade: ${response.statusText}`);
  }
  
  return response.json();
}

// Helper functions
export function getOutcomeString(trade: Trade): string {
  const outcomes = trade.market.outcomes as string[];
  if (Array.isArray(outcomes) && trade.outcomeIndex < outcomes.length) {
    return outcomes[trade.outcomeIndex];
  }
  return `Outcome ${trade.outcomeIndex}`;
}

export function getTradeType(trade: Trade): string {
  if (trade.agentId) {
    return `Agent ${trade.side === 'BID' ? 'Buy' : 'Sell'}`;
  }
  if (trade.userId) {
    return `User ${trade.side === 'BID' ? 'Buy' : 'Sell'}`;
  }
  return `${trade.side === 'BID' ? 'Buy' : 'Sell'}`;
}

export function getTradeEntity(trade: Trade): string {
  if (trade.agentId && trade.agent) {
    return trade.agent.name;
  }
  if (trade.userId && trade.user) {
    return trade.user.username || trade.user.address.slice(0, 8) + '...';
  }
  return 'Unknown';
}

export function isSimulation(trade: Trade): boolean {
  return trade.chainKey === 'tenderly';
}

export function formatTradeAmount(trade: Trade): string {
  const amount = parseFloat(trade.amount);
  const price = parseFloat(trade.price);
  const total = amount * price;
  
  return `${amount} @ $${price.toFixed(4)} = $${total.toFixed(2)}`;
}
