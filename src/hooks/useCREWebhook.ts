"use client";

/**
 * useCREWebhook — React hook for subscribing to CRE-triggered WebSocket events.
 *
 * Watches the Redux websocket.lastMessage for MARKET_UPDATE events
 * sourced from the webhookBridge CRE workflow (identified by source: "webhookBridge").
 * Components can filter by specific eventType without polling.
 *
 * Respects appConfig.websocketEnabled — no-ops when WebSocket is disabled.
 * No new WebSocket connection is created; reuses existing Redux state.
 */

import { useEffect, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { appConfig } from "@/config/app.config";

export interface CREWebhookEvent {
  eventType: string;
  source?: string;
  data?: Record<string, unknown>;
  forwardedAt?: string;
  [key: string]: unknown;
}

export interface UseCREWebhookOptions {
  /** Filter to a specific eventType (e.g. "compliance", "onchainEvent"). Pass undefined for all. */
  eventType?: string;
  /** Called when a matching CRE webhook event arrives. */
  onEvent: (event: CREWebhookEvent) => void;
  /** Toggle subscription on/off (default: true). */
  enabled?: boolean;
}

function extractCREPayload(message: unknown): CREWebhookEvent | null {
  if (typeof message !== "object" || message === null) return null;
  const msg = message as Record<string, unknown>;
  if (msg.type !== "REGISTRY_SYNC_UPDATE") return null;
  const payload = msg.payload as Record<string, unknown> | undefined;
  if (!payload || payload.source !== "webhookBridge") return null;
  if (typeof payload.eventType !== "string") return null;
  return payload as CREWebhookEvent;
}

/**
 * Subscribe to CRE webhook events broadcast by webhookBridge.ts via the backend WebSocket.
 * Uses Redux lastMessage — no extra WebSocket connection required.
 *
 * @example
 * useCREWebhook({
 *   eventType: "compliance",
 *   onEvent: (evt) => console.log("Compliance event:", evt),
 * });
 */
export function useCREWebhook({ eventType, onEvent, enabled = true }: UseCREWebhookOptions): void {
  const lastMessage = useAppSelector((state) => state.websocket.lastMessage);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !appConfig.websocketEnabled || !lastMessage) return;

    const crePayload = extractCREPayload(lastMessage);
    if (!crePayload) return;
    if (eventType && crePayload.eventType !== eventType) return;

    onEventRef.current(crePayload);
  }, [lastMessage, enabled, eventType]);
}
