"use client";

import { useAppSelector } from "@/store/hooks";
import { selectOrderBookByMarketId } from "@/store/slices/marketsSlice";
import type { OrderBookSnapshot } from "@/types/market.types";
import type { RecentTradeItem } from "@/store/slices/recentTradesSlice";
import { useMarketSocket } from "./useMarketSocket";

/**
 * Subscribes to market:{marketId} and returns the live order book (bids/asks).
 * Updates when the server sends ORDER_BOOK_UPDATE.
 */
export function useLiveOrderBook(
  marketId: string | null | undefined,
  outcomeIndex: number = 0
): OrderBookSnapshot | undefined {
  useMarketSocket({ marketId: marketId ?? undefined, enabled: Boolean(marketId) });
  return useAppSelector((state) =>
    marketId ? selectOrderBookByMarketId(state, marketId, outcomeIndex) : undefined
  );
}

/**
 * Returns the list of recent trades pushed via WebSocket (TRADE_EXECUTED).
 * Ensure useMarketSocket is mounted (e.g. with marketIds or subscribeToList) so trades are received.
 */
export function useRecentTrades(): RecentTradeItem[] {
  return useAppSelector((state) => state.recentTrades.items);
}
