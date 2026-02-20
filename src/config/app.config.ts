/**
 * Application configuration. Prefer env vars for URLs and feature flags.
 */

export const appConfig = {
  /** WebSocket URL for real-time updates. Use wss in production. */
  websocketUrl:
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "wss://echo.websocket.org",
  /** Enable WebSocket connection on app load. */
  websocketEnabled:
    process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED !== "false",
} as const;
