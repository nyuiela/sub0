/**
 * Application configuration. Non-sensitive defaults live here; secrets belong in .env only.
 * NEXT_PUBLIC_ vars are read at build time and safe to expose to the browser.
 */

// ─── Static non-env defaults (safe to commit) ────────────────────────────────
export const appDefaults = {
  wsReconnectDelayMs: 3_000,
  requestTimeoutMs: 15_000,
  defaultPageSize: 20,
  maxRetryAttempts: 3,
  blockExplorerUrl: "https://sepolia.basescan.org",
  usdcDailyMintCap: 100,
  simulationPollIntervalMs: 2_000,
  toastDurationMs: 4_000,
} as const;

// ─── Runtime config (may be overridden by env) ────────────────────────────────
export const appConfig = {
  /** WebSocket URL for real-time updates. Use wss in production. */
  websocketUrl:
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? "wss://echo.websocket.org",
  /** Enable WebSocket connection on app load. */
  websocketEnabled:
    process.env.NEXT_PUBLIC_WEBSOCKET_ENABLED !== "false",
  /** Block explorer base URL for tx links (default Base Sepolia). */
  blockExplorerUrl:
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL ?? appDefaults.blockExplorerUrl,
  /** Max USDC a user can mint daily (display-only cap). */
  usdcDailyMintCap:
    Number(process.env.NEXT_PUBLIC_USDC_DAILY_MINT_CAP ?? appDefaults.usdcDailyMintCap),
  /** Milliseconds between WebSocket reconnect attempts. */
  wsReconnectDelayMs: appDefaults.wsReconnectDelayMs,
  /** Default API request timeout in milliseconds. */
  requestTimeoutMs: appDefaults.requestTimeoutMs,
  /** Default page size for paginated lists. */
  defaultPageSize: appDefaults.defaultPageSize,
  /** Max number of retry attempts for failed requests. */
  maxRetryAttempts: appDefaults.maxRetryAttempts,
} as const;
