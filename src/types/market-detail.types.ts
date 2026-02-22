/**
 * Types for market detail page: Activity, Holders, Traders.
 * Extend when backend APIs for these are available.
 */

export interface MarketHolder {
  address: string;
  holdingValue: string;
  holdingPercent: number;
  totalPnl: string;
  totalPnlPercent: number;
  unrealizedPnl: string;
  unrealizedPnlPercent: number;
  boughtAmount: string;
  avgBuyPrice: string;
  buyTxCount: number;
  soldAmount: string;
  avgSellPrice: string;
  sellTxCount: number;
  lastActivityAt: string;
}

export interface MarketActivityItem {
  id: string;
  type: "trade" | "position" | "order";
  side?: "long" | "short";
  amount: string;
  price: string;
  at: string;
  address?: string;
}

export interface MarketTrader {
  address: string;
  volume: string;
  tradeCount: number;
  pnl: string;
  lastTradeAt: string;
}
