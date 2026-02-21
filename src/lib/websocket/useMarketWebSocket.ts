"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setOrderBookForMarket,
  applyTradeToMarket,
} from "@/store/slices/marketsSlice";
import type { OrderBookUpdatePayload, TradeExecutedPayload } from "@/types/market.types";
import { marketRoom } from "@/types/market.types";
import { getMarketWebSocketUrl } from "./marketWsUrl";
import { marketWebSocketService } from "./marketWebSocketService";

export interface UseMarketWebSocketOptions {
  marketIds: string[];
  enabled?: boolean;
  reconnectMaxAttempts?: number;
  reconnectIntervalMs?: number;
}

/**
 * Connects to backend /ws, subscribes to market:<id> for each marketId,
 * and dispatches ORDER_BOOK_UPDATE and TRADE_EXECUTED to Redux.
 */
export function useMarketWebSocket(options: UseMarketWebSocketOptions): void {
  const {
    marketIds,
    enabled = true,
    reconnectMaxAttempts = 5,
    reconnectIntervalMs = 3000,
  } = options;
  const dispatch = useAppDispatch();
  const subscribedRef = useRef<Set<string>>(new Set());
  const marketIdsRef = useRef<string[]>(marketIds);
  marketIdsRef.current = marketIds;

  const subscribeToMarketIds = (ids: string[]) => {
    if (marketWebSocketService.getReadyState() !== WebSocket.OPEN) return;
    const subscribed = subscribedRef.current;
    for (const id of ids) {
      if (subscribed.has(id)) continue;
      marketWebSocketService.send({
        type: "SUBSCRIBE",
        payload: { room: marketRoom(id) },
      });
      subscribed.add(id);
    }
  };

  useEffect(() => {
    const wsUrl = getMarketWebSocketUrl();
    if (!enabled || !wsUrl || marketIds.length === 0) {
      marketWebSocketService.disconnect();
      subscribedRef.current.clear();
      return;
    }

    marketWebSocketService.connect({
      url: wsUrl,
      reconnectMaxAttempts,
      reconnectIntervalMs,
      onStatus: (status) => {
        if (status === "open") {
          subscribedRef.current.clear();
          subscribeToMarketIds(marketIdsRef.current);
        }
      },
      onMessage: (message) => {
        if (message.type === "ORDER_BOOK_UPDATE") {
          const p = message.payload as OrderBookUpdatePayload;
          if (p?.marketId && Array.isArray(p.bids) && Array.isArray(p.asks)) {
            dispatch(
              setOrderBookForMarket({
                marketId: p.marketId,
                bids: p.bids,
                asks: p.asks,
                timestamp: typeof p.timestamp === "number" ? p.timestamp : Date.now(),
              })
            );
          }
        } else if (message.type === "TRADE_EXECUTED") {
          const p = message.payload as TradeExecutedPayload;
          if (p?.marketId && p?.executedAt != null) {
            dispatch(applyTradeToMarket(p));
          }
        }
      },
    });

    return () => {
      marketWebSocketService.disconnect();
      subscribedRef.current.clear();
    };
  }, [enabled, reconnectMaxAttempts, reconnectIntervalMs, dispatch]);

  useEffect(() => {
    subscribeToMarketIds(marketIds);
  }, [marketIds]);
}
