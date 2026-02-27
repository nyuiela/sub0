"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setStatus,
  setLastMessage,
  setLastError,
  setReconnectAttempts,
  resetWebSocket,
} from "@/store/slices/websocketSlice";
import type { WebSocketStatus } from "@/types/websocket.types";
import { websocketService } from "./websocketService";

const WS_STATUS_MAP = {
  connecting: "connecting" as WebSocketStatus,
  open: "open" as WebSocketStatus,
  closed: "closed" as WebSocketStatus,
  error: "error" as WebSocketStatus,
};

export interface UseWebSocketOptions {
  url: string;
  enabled?: boolean;
  reconnectMaxAttempts?: number;
  reconnectIntervalMs?: number;
}

/**
 * Hook to connect WebSocket and sync status/lastMessage to Redux.
 * Use when you need app-wide real-time updates; Redux holds single source of truth.
 */
export function useWebSocket(options: UseWebSocketOptions): void {
  const {
    url,
    enabled = true,
    reconnectMaxAttempts = 5,
    reconnectIntervalMs = 3000,
  } = options;
  const dispatch = useAppDispatch();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!enabled || !url) {
      queueMicrotask(() => dispatch(resetWebSocket()));
      return;
    }

    websocketService.connect({
      url,
      reconnectMaxAttempts,
      reconnectIntervalMs,
      onStatus: (status) => {
        dispatch(setStatus(WS_STATUS_MAP[status] ?? "idle"));
        if (status === "open") dispatch(setReconnectAttempts(0));
      },
      onMessage: (message) => {
        dispatch(setLastMessage(message));
        dispatch(setLastError(null));
      },
    });

    return () => {
      websocketService.disconnect();
      dispatch(setStatus("closed"));
    };
  }, [url, enabled, reconnectMaxAttempts, reconnectIntervalMs, dispatch]);
}
