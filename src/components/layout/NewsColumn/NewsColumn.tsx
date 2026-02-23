"use client";

import { useEffect, useState } from "react";
import { getFeed } from "@/lib/api/feed";
import type { FeedItem, FeedSource } from "@/types/feed.types";

const FEED_LIMIT = 20;
const DEFAULT_CURRENCIES = "BTC,ETH";

function formatSource(source: FeedSource): string {
  if (source === "RSS_COINDESK") return "CoinDesk";
  if (source === "RSS_COINTELEGRAPH") return "CoinTelegraph";
  if (source === "CRYPTOPANIC") return "CryptoPanic";
  return source;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export interface NewsColumnProps {
  /** Comma-separated tickers. Default BTC,ETH. */
  currencies?: string;
  /** Max items. Default 20. */
  limit?: number;
  className?: string;
}

export function NewsColumn({
  currencies = DEFAULT_CURRENCIES,
  limit = FEED_LIMIT,
  className = "",
}: NewsColumnProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    getFeed({ currencies, limit })
      .then((res) => {
        if (!cancelled) {
          setItems(res.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load news");
          setItems([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [currencies, limit]);

  if (loading && items.length === 0) {
    return (
      <ul
        className={`space-y-0 ${className}`.trim()}
        aria-label="News loading"
      >
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="animate-pulse border-b border-border bg-surface p-3">
            <div className="mb-1 h-3 w-2/3 rounded bg-muted/50" />
            <div className="h-3 w-1/2 rounded bg-muted/50" />
          </li>
        ))}
      </ul>
    );
  }

  if (error != null) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`.trim()}>
        {error}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`.trim()}>
        No news yet. Feed will update when the ingest runs.
      </p>
    );
  }

  return (
    <ul
      className={`space-y-0 ${className}`.trim()}
      aria-label="Crypto news feed"
    >
      {items.map((item) => (
        <li key={item.id}>
          <article className="border-b border-border bg-surface p-3 transition-colors last:border-b-0 hover:bg-muted/30">
            {item.sourceUrl != null && item.sourceUrl !== "" ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                <h4 className="line-clamp-2 text-sm font-medium text-foreground">
                  {item.title}
                </h4>
              </a>
            ) : (
              <h4 className="line-clamp-2 text-sm font-medium text-foreground">
                {item.title}
              </h4>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0 text-xs">
              <span className="text-warning">{formatSource(item.source)}</span>
              <span className="text-muted-foreground" aria-hidden>{formatDate(item.publishedAt)}</span>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
