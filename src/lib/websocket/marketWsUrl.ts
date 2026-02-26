/**
 * WebSocket URL for backend /ws (market order book and trade updates).
 * Set NEXT_PUBLIC_WEBSOCKET_URL (e.g. ws://localhost:4000/ws) or
 * NEXT_PUBLIC_BACKEND_URL (e.g. http://localhost:4000) so the client can connect.
 */

export function getMarketWebSocketUrl(): string {
  const envWs = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (envWs && envWs.startsWith("ws")) return envWs;
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  if (!base) {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        return "ws://localhost:4000/ws";
      }
    }
    return "";
  }
  const wsBase = base.replace(/^http/, "ws");
  return wsBase.endsWith("/ws") ? wsBase : `${wsBase.replace(/\/$/, "")}/ws`;
}
