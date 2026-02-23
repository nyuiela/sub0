"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPositions } from "@/lib/api/positions";
import type { Position } from "@/types/position.types";

export interface TrackerMarketsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

export function TrackerMarketsColumn({
  selectedAgentId,
  className = "",
}: TrackerMarketsColumnProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAgentId == null) {
      setPositions([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getPositions({ agentId: selectedAgentId, limit: 100 })
      .then((res) => {
        if (!cancelled) {
          setPositions(res.data ?? []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPositions([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedAgentId]);

  const marketIds = Array.from(
    new Map(positions.map((p) => [p.marketId, p.market])).entries()
  );

  if (selectedAgentId == null) {
    return (
      <aside
        className={`flex flex-col items-center justify-center rounded bg-surface p-6 text-sm text-muted-foreground ${className}`.trim()}
        aria-label="Markets traded"
      >
        <p>Select an agent to see markets traded.</p>
      </aside>
    );
  }

  return (
    <aside
      className={`flex flex-col overflow-hidden ${className}`.trim()}
      aria-label="Markets traded by agent"
    >
      <h3 className="border-b border-border bg-surface px-4 py-3 text-sm font-semibold text-foreground">
        Markets traded
      </h3>
      <div className="flex-1 overflow-auto">
        {loading ? (
          <ul className="space-y-0">
            {[1, 2, 3, 4].map((i) => (
              <li
                key={i}
                className="animate-pulse border-b border-border bg-surface p-3"
              >
                <div className="h-4 w-3/4 rounded bg-muted/50" />
              </li>
            ))}
          </ul>
        ) : marketIds.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No positions yet; markets will appear after trading.
          </p>
        ) : (
          <ul className="space-y-0">
            {marketIds.map(([marketId, market]) => (
              <li key={marketId}>
                <Link
                  href={`/market/${marketId}`}
                  className="block border-b border-border bg-surface p-3 transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <span className="line-clamp-2 text-sm font-medium text-foreground">
                    {market?.name ?? marketId.slice(0, 8)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
