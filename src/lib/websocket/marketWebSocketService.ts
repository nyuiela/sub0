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
    const state = this.ws?.readyState;
    if (state === WebSocket.CONNECTING) return;
    if (state === WebSocket.OPEN) {
      this.onStatus?.("open");
      return;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws != null) {
      this.ws.onopen = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.close(1000, "Reconnect");
      this.ws = null;
    }
    this.onStatus?.("connecting");
    try {
      this.ws = new WebSocket(this.url);
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = (ev: CloseEvent) => this.handleClose(ev);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch {
      this.onStatus?.("error");
    }
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.onStatus?.("open");
  }

  private getBackoffDelayMs(): number {
    const delay =
      this.reconnectIntervalMs *
      Math.pow(RECONNECT_BACKOFF_MULTIPLIER, this.reconnectAttempts);
    return Math.min(Math.floor(delay), RECONNECT_MAX_INTERVAL_MS);
  }

  private handleClose(_ev?: CloseEvent): void {
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
