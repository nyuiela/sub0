/**
 * WebSocket URL for backend /ws (market order book and trade updates).
 * Uses NEXT_PUBLIC_WEBSOCKET_URL when set, otherwise derives from NEXT_PUBLIC_BACKEND_URL.
 */

export function getMarketWebSocketUrl(): string {
  const envWs = process.env.NEXT_PUBLIC_WEBSOCKET_URL;
  if (envWs && envWs.startsWith("ws")) return envWs;
  const base = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
  if (!base) return "";
  const wsBase = base.replace(/^http/, "ws");
  return wsBase.endsWith("/ws") ? wsBase : `${wsBase.replace(/\/$/, "")}/ws`;
}
