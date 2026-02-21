"use client";

import { useAppSelector } from "@/store/hooks";
import type { WebSocketStatus } from "@/types/websocket.types";

const STATUS_LABELS: Record<WebSocketStatus, string> = {
  idle: "Disconnected",
  connecting: "Connecting…",
  open: "Live",
  closing: "Closing…",
  closed: "Disconnected",
  error: "Error",
};

export function WebSocketStatusIndicator() {
  const status = useAppSelector((state) => state.websocket.status);
  const lastError = useAppSelector((state) => state.websocket.lastError);
  const lastMessage = useAppSelector((state) => state.websocket.lastMessage);

  const isLive = status === "open";
  const isError = status === "error";

  return (
    <section
      className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-3"
      aria-live="polite"
      aria-label="WebSocket connection status"
    >
      <p className="flex items-center gap-2 text-sm text-muted">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor:
              isLive
                ? "var(--color-success)"
                : isError
                  ? "var(--color-danger)"
                  : "var(--color-text-disabled)",
          }}
          aria-hidden
        />
        {STATUS_LABELS[status]}
      </p>
      {lastError && (
        <p className="text-xs text-danger">{lastError}</p>
      )}
      {lastMessage && (
        <p className="max-w-[200px] truncate text-xs text-muted">
          Last: {lastMessage.type}
        </p>
      )}
    </section>
  );
}
