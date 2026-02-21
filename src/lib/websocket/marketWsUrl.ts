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
  const url = wsBase.endsWith("/ws") ? wsBase : `${wsBase.replace(/\/$/, "")}/ws`;
  // #region agent log
  if (typeof window !== "undefined") {
    fetch("http://127.0.0.1:7915/ingest/3b911369-b723-45b4-9277-af4b4050e1fd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "00c267" },
      body: JSON.stringify({
        sessionId: "00c267",
        location: "marketWsUrl.ts:getMarketWebSocketUrl",
        message: "Market WS URL resolved",
        data: { url: url || "(empty)", hasEnvWs: !!envWs, hasBackend: !!base },
        timestamp: Date.now(),
        hypothesisId: "H1",
      }),
    }).catch(() => {});
  }
  // #endregion
  return url;
}
