/**
 * WebSocket service for backend /ws: market order book and trade updates.
 * Separate instance so it does not conflict with the generic app WebSocket.
 */

import type { WebSocketMessage } from "@/types/websocket.types";

const DEFAULT_RECONNECT_INTERVAL_MS = 2000;
const DEFAULT_RECONNECT_MAX_ATTEMPTS = 10;
const RECONNECT_BACKOFF_MULTIPLIER = 1.5;
const RECONNECT_MAX_INTERVAL_MS = 30_000;

export type ConnectionStatusCallback = (status: "connecting" | "open" | "closed" | "error") => void;
export type MessageCallback = (message: WebSocketMessage) => void;

export interface MarketWebSocketServiceOptions {
  url: string;
  reconnectIntervalMs?: number;
  reconnectMaxAttempts?: number;
  onStatus?: ConnectionStatusCallback;
  onMessage?: MessageCallback;
}

class MarketWebSocketService {
  private ws: WebSocket | null = null;
  private url: string = "";
  private reconnectIntervalMs: number = DEFAULT_RECONNECT_INTERVAL_MS;
  private reconnectMaxAttempts: number = DEFAULT_RECONNECT_MAX_ATTEMPTS;
  private reconnectAttempts: number = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private onStatus: ConnectionStatusCallback | undefined;
  private onMessage: MessageCallback | undefined;

  connect(options: MarketWebSocketServiceOptions): void {
    this.url = options.url;
    this.reconnectIntervalMs = options.reconnectIntervalMs ?? DEFAULT_RECONNECT_INTERVAL_MS;
    this.reconnectMaxAttempts = options.reconnectMaxAttempts ?? DEFAULT_RECONNECT_MAX_ATTEMPTS;
    this.onStatus = options.onStatus;
    this.onMessage = options.onMessage;
    this.reconnectAttempts = 0;
    this.open();
  }

  private open(): void {
    if (typeof window === "undefined" || !this.url) return;
    this.onStatus?.("connecting");
    // #region agent log
    fetch("http://127.0.0.1:7915/ingest/3b911369-b723-45b4-9277-af4b4050e1fd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "00c267" },
      body: JSON.stringify({
        sessionId: "00c267",
        location: "marketWebSocketService.ts:open",
        message: "Market WS open() called",
        data: { url: this.url },
        timestamp: Date.now(),
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch {
      this.onStatus?.("error");
    }
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    // #region agent log
    fetch("http://127.0.0.1:7915/ingest/3b911369-b723-45b4-9277-af4b4050e1fd", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "00c267" },
      body: JSON.stringify({
        sessionId: "00c267",
        location: "marketWebSocketService.ts:handleOpen",
        message: "Market WS connection open",
        data: {},
        timestamp: Date.now(),
        hypothesisId: "H2",
      }),
    }).catch(() => {});
    // #endregion
    this.onStatus?.("open");
  }

  private getBackoffDelayMs(): number {
    const delay =
      this.reconnectIntervalMs *
      Math.pow(RECONNECT_BACKOFF_MULTIPLIER, this.reconnectAttempts);
    return Math.min(Math.floor(delay), RECONNECT_MAX_INTERVAL_MS);
  }

  private handleClose(): void {
    this.ws = null;
    this.onStatus?.("closed");
    if (this.reconnectAttempts < this.reconnectMaxAttempts) {
      const delayMs = this.getBackoffDelayMs();
      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts += 1;
        this.open();
      }, delayMs);
    }
  }

  private handleError(): void {
    this.onStatus?.("error");
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data as string) as Record<string, unknown>;
      const type = (data.type as string) ?? "unknown";
      // #region agent log
      fetch("http://127.0.0.1:7915/ingest/3b911369-b723-45b4-9277-af4b4050e1fd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "00c267" },
        body: JSON.stringify({
          sessionId: "00c267",
          location: "marketWebSocketService.ts:handleMessage",
          message: "Market WS message received",
          data: { type, hasPayload: "payload" in data },
          timestamp: Date.now(),
          hypothesisId: "H3",
        }),
      }).catch(() => {});
      // #endregion
      if (type === "PING") {
        this.send({ type: "PONG" });
        return;
      }
      const payload = data.payload ?? data;
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: typeof data.timestamp === "number" ? data.timestamp : Date.now(),
      };
      this.onMessage?.(message);
    } catch {
      this.onMessage?.({
        type: "raw",
        payload: event.data,
        timestamp: Date.now(),
      });
    }
  }

  send(data: string | object): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    // #region agent log
    const obj = typeof data === "string" ? null : (data as Record<string, unknown>);
    if (obj?.type === "SUBSCRIBE") {
      fetch("http://127.0.0.1:7915/ingest/3b911369-b723-45b4-9277-af4b4050e1fd", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "00c267" },
        body: JSON.stringify({
          sessionId: "00c267",
          location: "marketWebSocketService.ts:send",
          message: "SUBSCRIBE sent",
          data: { room: (obj.payload as { room?: string })?.room, readyState: this.ws?.readyState },
          timestamp: Date.now(),
          hypothesisId: "H2",
        }),
      }).catch(() => {});
    }
    // #endregion
    this.ws.send(payload);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, "Client disconnect");
      this.ws = null;
    }
    this.onStatus?.("closed");
  }

  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}

export const marketWebSocketService = new MarketWebSocketService();
