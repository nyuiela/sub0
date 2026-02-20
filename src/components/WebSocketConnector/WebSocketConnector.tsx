"use client";

import { useWebSocket } from "@/lib/websocket";
import { appConfig } from "@/config/app.config";

/**
 * Mounts once inside AppProviders and establishes WebSocket connection.
 * Redux holds status and lastMessage for the rest of the app.
 */
export function WebSocketConnector() {
  useWebSocket({
    url: appConfig.websocketUrl,
    enabled: appConfig.websocketEnabled,
    reconnectMaxAttempts: 5,
    reconnectIntervalMs: 3000,
  });
  return null;
}
