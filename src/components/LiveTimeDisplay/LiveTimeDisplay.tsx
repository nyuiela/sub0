"use client";

import { useEffect, useRef } from "react";
import { formatTimeAgo } from "./formatTimeAgo";

export interface LiveTimeDisplayProps {
  /** ISO date string; when provided, shows live-updating "time ago". */
  createdAt?: string;
  /** Shown when createdAt is missing (e.g. truncated address for markets). */
  fallback?: string;
  className?: string;
}

/**
 * Displays a live "time ago" by updating the DOM every second via ref.
 * Avoids parent re-renders. Use for markets, trades, and positions on the main page.
 */
export function LiveTimeDisplay({
  createdAt,
  fallback = "",
  className = "",
}: LiveTimeDisplayProps) {
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!createdAt) return;

    const updateTime = () => {
      if (timeRef.current) {
        timeRef.current.textContent = formatTimeAgo(createdAt, new Date());
      }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [createdAt]);

  if (!createdAt) {
    return <span className={className}>{fallback}</span>;
  }

  return <span ref={timeRef} className={className} />;
}
