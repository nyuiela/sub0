"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setOrderBookForMarket,
  applyTradeToMarket,
  setMarketVolumeFromStats,
} from "@/store/slices/marketsSlice";
import { fetchMarkets, fetchMarketById } from "@/store/slices/marketsSlice";
import { setStatus } from "@/store/slices/websocketSlice";
import { requestPositionsRefetch } from "@/store/slices/positionsSlice";
import { addRecentTrade } from "@/store/slices/recentTradesSlice";
import type { OrderBookSnapshot } from "@/types/market.types";
import type { WebSocketStatus } from "@/types/websocket.types";
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
/** Debounce list refetch when many markets are created in a burst (e.g. CRE creates 20–30). */
const LIST_REFETCH_DEBOUNCE_MS = 600;

function toReduxStatus(s: MarketSocketStatus): WebSocketStatus {
  if (s === "connecting") return "connecting";
  if (s === "open") return "open";
  if (s === "closed" || s === "error") return s;
  return "closed";
}

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
  /** Called for each TRADE_EXECUTED (e.g. for chart real-time stitching). Batched by consumer. */
  onTradeExecuted?: (payload: TradeExecutedPayload) => void;
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
 * Manages WebSocket connection (ref-counted by mount), SUBSCRIBE/UNSUBSCRIBE for
 * market(s) and "markets" room, PING/PONG, and routes events.
 * Connection is kept open while any useMarketSocket is mounted; changing
 * marketIds only updates subscriptions so the connection does not drop.
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
  const listRefetchTimeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

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
    if (!enabled || !hasRoomsIntent) return;
    connectionRefCount += 1;
    return () => {
      connectionRefCount = Math.max(0, connectionRefCount - 1);
      throttleRef.current?.flush();
      throttleRef.current = null;
      if (connectionRefCount === 0) {
        const state = marketWebSocketService.getReadyState();
        if (state === WebSocket.OPEN) {
          marketWebSocketService.disconnect();
        }
        dispatch(setStatus("closed"));
      }
    };
  }, [enabled, hasRoomsIntent, dispatch]);

  useEffect(() => {
    optionsRef.current = options;
    const wsUrl = getMarketWebSocketUrl();
    const roomsToSubscribe: string[] = [];
    if (marketId) roomsToSubscribe.push(marketRoom(marketId));
    const ids = marketIdsOption ?? [];
    for (const id of ids) roomsToSubscribe.push(marketRoom(id));
    if (subscribeToList) roomsToSubscribe.push(WS_ROOM_MARKETS);
    roomsRef.current = roomsToSubscribe;

    if (!enabled || !hasRoomsIntent || roomsToSubscribe.length === 0) {
      return;
    }
    if (!wsUrl) {
      dispatch(setStatus("closed"));
      return;
    }

    const subscribeToRooms = () => {
      const rooms = roomsRef.current;
      for (const room of rooms) {
        if (subscribedRoomsRef.current.has(room)) continue;
        marketWebSocketService.send({ type: "SUBSCRIBE", payload: { room } });
        subscribedRoomsRef.current.add(room);
      }
    };

    const shouldConnect = connectionRefCount >= 1;
    const readyState = marketWebSocketService.getReadyState();

    if (shouldConnect) {
      if (readyState !== WebSocket.OPEN && readyState !== WebSocket.CONNECTING) {
        marketWebSocketService.connect({
          url: wsUrl,
          reconnectMaxAttempts,
          reconnectIntervalMs,
          onStatus: (status) => {
            dispatch(setStatus(toReduxStatus(status as MarketSocketStatus)));
            optionsRef.current.onStatus?.(status as MarketSocketStatus);
            if (status === "open") {
              if (connectionRefCount === 0) {
                marketWebSocketService.disconnect();
                dispatch(setStatus("closed"));
                return;
              }
              subscribedRoomsRef.current.clear();
              // Defer subscribe so the server has attached its message handler (await register).
              setTimeout(() => subscribeToRooms(), 0);
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
              if (p?.marketId && p?.executedAt != null) {
                ensureThrottle().pushTrade(p);
                dispatch(addRecentTrade(p));
                optionsRef.current.onTradeExecuted?.(p);
              }
            } else if (type === "MARKET_UPDATED") {
              const p = payload as MarketUpdatedPayload | undefined;
              if (!p?.marketId) return;
              const reason = p.reason;

              if (reason === "created" || reason === "updated" || reason === "deleted") {
                if (reason === "created" && listRefetchTimeoutRef.current == null) {
                  listRefetchTimeoutRef.current = window.setTimeout(() => {
                    listRefetchTimeoutRef.current = null;
                    void dispatch(fetchMarkets({ limit: 50, offset: 0 }));
                  }, LIST_REFETCH_DEBOUNCE_MS);
                } else if (reason !== "created") {
                  if (listRefetchTimeoutRef.current != null) {
                    clearTimeout(listRefetchTimeoutRef.current);
                    listRefetchTimeoutRef.current = null;
                  }
                  void dispatch(fetchMarkets({ limit: 24, offset: 0 }));
                }
                if (reason !== "deleted" && p.marketId) {
                  void dispatch(fetchMarketById(p.marketId));
                }
              } else if (reason === "stats" && typeof p.volume === "string") {
                dispatch(setMarketVolumeFromStats({ marketId: p.marketId, volume: p.volume }));
              } else if (reason === "position") {
                dispatch(requestPositionsRefetch());
                void dispatch(fetchMarketById(p.marketId));
              }
            }
          },
        });
      } else {
        subscribeToRooms();
      }
    }

    return () => {
      if (listRefetchTimeoutRef.current != null) {
        clearTimeout(listRefetchTimeoutRef.current);
        listRefetchTimeoutRef.current = null;
      }
      const toUnsub = new Set(subscribedRoomsRef.current);
      for (const room of toUnsub) {
        if (marketWebSocketService.getReadyState() === WebSocket.OPEN) {
          marketWebSocketService.send({ type: "UNSUBSCRIBE", payload: { room } });
        }
        subscribedRoomsRef.current.delete(room);
      }
    };
  }, [
    enabled,
    hasRoomsIntent,
    marketId ?? "",
    marketIdsOption?.length ?? 0,
    marketIdsOption?.join(",") ?? "",
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
