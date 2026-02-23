"use client";

import { useAppSelector } from "@/store/hooks";
import type { WebSocketStatus } from "@/types/websocket.types";

const FOOTER_LINKS = [
  { label: "Markets", href: "#" },
  { label: "Account", href: "#" },
  { label: "X Tracker", href: "#" },
  { label: "Wallet Tracker", href: "#" },
  { label: "Telegram Tracker", href: "#" },
  { label: "Season 1", href: "#" },
  { label: "App", href: "#" },
  { label: "Invite", href: "#" },
  { label: "Events", href: "#" },
];

const WS_STATUS_LABELS: Record<WebSocketStatus, string> = {
  idle: "Disconnected",
  connecting: "Connecting…",
  open: "Live",
  closing: "Closing…",
  closed: "Disconnected",
  error: "Error",
};

export function BottomNav() {
  const wsStatus = useAppSelector((state) => state.websocket.status);
  const isLive = wsStatus === "open";
  const isError = wsStatus === "error";

  return (
    <footer className="bg-surface">
      <nav
        className="mx-auto flex w-full flex-wrap items-center justify-center gap-2 px-4 py-3 sm:justify-start sm:gap-4 sm:px-6"
        aria-label="Secondary navigation"
      >
        <span
          className="flex items-center gap-1.5 text-xs text-muted"
          aria-live="polite"
          aria-label={`WebSocket: ${WS_STATUS_LABELS[wsStatus]}`}
        >
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{
              backgroundColor: isLive
                ? "var(--color-success)"
                : isError
                  ? "var(--color-danger)"
                  : "var(--color-text-disabled)",
            }}
            aria-hidden
          />
          {WS_STATUS_LABELS[wsStatus]}
        </span>
        <span className="hidden text-border sm:inline" aria-hidden>
          |
        </span>
        {FOOTER_LINKS.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="cursor-pointer text-xs font-medium text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
