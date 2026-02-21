"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setOrderBookForMarket,
  applyTradeToMarket,
  setMarketVolumeFromStats,
} from "@/store/slices/marketsSlice";
import { fetchMarkets, fetchMarketById } from "@/store/slices/marketsSlice";
import type { OrderBookSnapshot } from "@/types/market.types";
import {
  marketRoom,
  WS_ROOM_MARKETS,
  type MarketUpdatedPayload,
  type OrderBookUpdatePayload,
  type TradeExecutedPayload,
  ORDER_BOOK_THROTTLE_MS,
  type MarketSocketStatus,
} from "./websocket-types";
import { getMarketWebSocketUrl } from "./marketWsUrl";
import { marketWebSocketService } from "./marketWebSocketService";

const DEFAULT_RECONNECT_MAX_ATTEMPTS = 10;
const DEFAULT_RECONNECT_INTERVAL_MS = 2000;

export interface UseMarketSocketOptions {
  /** Subscribe to a single market (order book, trades, market updates). */
  marketId?: string | null;
  /** Subscribe to each market for order book/trades (e.g. list view). */
  marketIds?: string[];
  /** Subscribe to the "markets" room for create/delete list updates. */
  subscribeToList?: boolean;
  /** When false, no connection or subscriptions. */
  enabled?: boolean;
  reconnectMaxAttempts?: number;
  reconnectIntervalMs?: number;
  /** Called when connection status changes. */
  onStatus?: (status: MarketSocketStatus) => void;
}

type PendingOrderBook = { marketId: string; bids: OrderBookSnapshot["bids"]; asks: OrderBookSnapshot["asks"]; timestamp: number };
type PendingTrade = TradeExecutedPayload;

function createThrottledDispatch(
  dispatch: ReturnType<typeof useAppDispatch>,
  throttleMs: number
) {
  let orderBookRafId: number | null = null;
  let tradeRafId: number | null = null;
  let lastOrderBookFlush = 0;
  let lastTradeFlush = 0;
  const orderBookQueue: PendingOrderBook[] = [];
  const tradeQueue: PendingTrade[] = [];

  function flushOrderBook() {
    orderBookRafId = null;
    const now = Date.now();
    if (now - lastOrderBookFlush < throttleMs && orderBookQueue.length === 0) return;
    lastOrderBookFlush = now;
    const latestByMarket = new Map<string, PendingOrderBook>();
    for (const p of orderBookQueue) latestByMarket.set(p.marketId, p);
    orderBookQueue.length = 0;
    for (const p of latestByMarket.values()) {
      dispatch(setOrderBookForMarket({ ...p }));
    }
  }

  function flushTrades() {
    tradeRafId = null;
    const now = Date.now();
    if (now - lastTradeFlush < throttleMs && tradeQueue.length === 0) return;
    lastTradeFlush = now;
    for (const p of tradeQueue) dispatch(applyTradeToMarket(p));
    tradeQueue.length = 0;
  }

  return {
    pushOrderBook(p: PendingOrderBook) {
      orderBookQueue.push(p);
      if (orderBookRafId == null) {
        orderBookRafId = requestAnimationFrame(() => {
          flushOrderBook();
        });
      }
    },
    pushTrade(p: PendingTrade) {
      tradeQueue.push(p);
      if (tradeRafId == null) {
        tradeRafId = requestAnimationFrame(() => {
          flushTrades();
        });
      }
    },
    flush() {
      if (orderBookRafId != null) cancelAnimationFrame(orderBookRafId);
      if (tradeRafId != null) cancelAnimationFrame(tradeRafId);
      flushOrderBook();
      flushTrades();
    },
  };
}

let connectionRefCount = 0;

/**
 * Manages WebSocket connection (ref-counted), SUBSCRIBE/UNSUBSCRIBE for
 * market(s) and "markets" room, PING/PONG, and routes events:
 * - ORDER_BOOK_UPDATE / TRADE_EXECUTED: throttled into Redux (no full refetch).
 * - MARKET_UPDATED (created/updated/deleted): invalidates list/detail (refetch).
 * - MARKET_UPDATED (stats): merges volume into state.
 */
export function useMarketSocket(options: UseMarketSocketOptions): void {
  const {
    marketId,
    marketIds: marketIdsOption,
    subscribeToList = false,
    enabled = true,
    reconnectMaxAttempts = DEFAULT_RECONNECT_MAX_ATTEMPTS,
    reconnectIntervalMs = DEFAULT_RECONNECT_INTERVAL_MS,
    onStatus,
  } = options;

  const dispatch = useAppDispatch();
  const subscribedRoomsRef = useRef<Set<string>>(new Set());
  const throttleRef = useRef<ReturnType<typeof createThrottledDispatch> | null>(null);
  const optionsRef = useRef(options);
  const roomsRef = useRef<string[]>([]);

  const ensureThrottle = useCallback(() => {
    if (throttleRef.current == null) {
      throttleRef.current = createThrottledDispatch(dispatch, ORDER_BOOK_THROTTLE_MS);
    }
    return throttleRef.current;
  }, [dispatch]);

  const hasRoomsIntent =
    enabled &&
    (!!marketId || subscribeToList || (marketIdsOption != null && marketIdsOption.length > 0));

  useEffect(() => {
    optionsRef.current = options;
    const wsUrl = getMarketWebSocketUrl();
    const roomsToSubscribe: string[] = [];
    if (marketId) roomsToSubscribe.push(marketRoom(marketId));
    const ids = marketIdsOption ?? [];
    for (const id of ids) roomsToSubscribe.push(marketRoom(id));
    if (subscribeToList) roomsToSubscribe.push(WS_ROOM_MARKETS);
    roomsRef.current = roomsToSubscribe;

    if (!enabled || !wsUrl || !hasRoomsIntent || roomsToSubscribe.length === 0) return;

    connectionRefCount += 1;
    const shouldConnect = connectionRefCount === 1;

    const subscribeToRooms = () => {
      const rooms = roomsRef.current;
      for (const room of rooms) {
        if (subscribedRoomsRef.current.has(room)) continue;
        marketWebSocketService.send({ type: "SUBSCRIBE", payload: { room } });
        subscribedRoomsRef.current.add(room);
      }
    };

    if (shouldConnect) {
      marketWebSocketService.connect({
        url: wsUrl,
        reconnectMaxAttempts,
        reconnectIntervalMs,
        onStatus: (status) => {
          optionsRef.current.onStatus?.(status as MarketSocketStatus);
          if (status === "open") {
            subscribedRoomsRef.current.clear();
            subscribeToRooms();
          }
        },
        onMessage: (message) => {
          const type = message.type as string;
          const payload = message.payload as Record<string, unknown> | undefined;

          if (type === "ORDER_BOOK_UPDATE") {
            const p = payload as OrderBookUpdatePayload | undefined;
            if (p?.marketId && Array.isArray(p.bids) && Array.isArray(p.asks)) {
              ensureThrottle().pushOrderBook({
                marketId: p.marketId,
                bids: p.bids,
                asks: p.asks,
                timestamp: typeof p.timestamp === "number" ? p.timestamp : Date.now(),
              });
            }
          } else if (type === "TRADE_EXECUTED") {
            const p = payload as TradeExecutedPayload | undefined;
            if (p?.marketId && p?.executedAt != null) ensureThrottle().pushTrade(p);
          } else if (type === "MARKET_UPDATED") {
            const p = payload as MarketUpdatedPayload | undefined;
            if (!p?.marketId) return;
            const reason = p.reason;

            if (reason === "created" || reason === "updated" || reason === "deleted") {
              void dispatch(fetchMarkets({ limit: 24, offset: 0 }));
              if (reason !== "deleted" && p.marketId) {
                void dispatch(fetchMarketById(p.marketId));
              }
            } else if (reason === "stats" && typeof p.volume === "string") {
              dispatch(setMarketVolumeFromStats({ marketId: p.marketId, volume: p.volume }));
            }
          }
        },
      });
    } else if (marketWebSocketService.getReadyState() === WebSocket.OPEN) {
      subscribeToRooms();
    }

    return () => {
      const toUnsub = new Set(subscribedRoomsRef.current);
      for (const room of toUnsub) {
        marketWebSocketService.send({ type: "UNSUBSCRIBE", payload: { room } });
      }
      subscribedRoomsRef.current.clear();
      connectionRefCount = Math.max(0, connectionRefCount - 1);
      if (connectionRefCount === 0) {
        throttleRef.current?.flush();
        throttleRef.current = null;
        marketWebSocketService.disconnect();
      }
    };
  }, [
    enabled,
    hasRoomsIntent,
    marketId ?? "",
    marketIdsOption?.length ?? 0,
    subscribeToList,
    reconnectMaxAttempts,
    reconnectIntervalMs,
    dispatch,
    ensureThrottle,
  ]);

  useEffect(() => {
    if (!enabled) return;
    const nextRooms: string[] = [];
    if (marketId) nextRooms.push(marketRoom(marketId));
    const ids = marketIdsOption ?? [];
    for (const id of ids) nextRooms.push(marketRoom(id));
    if (subscribeToList) nextRooms.push(WS_ROOM_MARKETS);
    roomsRef.current = nextRooms;

    if (marketWebSocketService.getReadyState() !== WebSocket.OPEN) return;
    for (const room of nextRooms) {
      if (subscribedRoomsRef.current.has(room)) continue;
      marketWebSocketService.send({ type: "SUBSCRIBE", payload: { room } });
      subscribedRoomsRef.current.add(room);
    }
  }, [enabled, marketId ?? "", marketIdsOption?.join(",") ?? "", subscribeToList]);
}
