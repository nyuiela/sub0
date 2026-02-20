/**
 * WebSocket types for real-time prediction market updates.
 * Placeholder contract for seamless data updates across the application.
 */

export type WebSocketStatus = "idle" | "connecting" | "open" | "closing" | "closed" | "error";

export interface WebSocketMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface WebSocketState {
  status: WebSocketStatus;
  lastMessage: WebSocketMessage | null;
  lastError: string | null;
  reconnectAttempts: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectMaxAttempts?: number;
  reconnectIntervalMs?: number;
}
