"use client";

/**
 * WebSocket is managed by useMarketSocket (Markets page / Market detail).
 * Status is synced to Redux there. This component no longer opens a separate
 * connection (avoids connecting to echo server or duplicating backend connection).
 */
export function WebSocketConnector() {
  return null;
}
