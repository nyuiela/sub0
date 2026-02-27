"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { getPositions } from "@/lib/api/positions";
import type { Position, PositionMarket } from "@/types/position.types";
import type { Market } from "@/types/market.types";
import { MiniMarketCard } from "@/components/market/MiniMarketCard";

export interface TrackerMarketsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

function positionMarketToMarket(
  marketId: string,
  market: PositionMarket | undefined
): Market {
  const name = market?.name ?? marketId.slice(0, 8);
  const conditionId = market?.conditionId ?? marketId;
  return {
    id: marketId,
    name,
    creatorAddress: "",
    volume: "0",
    context: null,
    imageUrl: null,
    outcomes: ["Yes", "No"],
    sourceUrl: null,
    resolutionDate: "",
    oracleAddress: "",
    status: "OPEN",
    collateralToken: "",
    conditionId,
    createdAt: "",
    updatedAt: "",
    totalVolume: "0",
  };
}

export function TrackerMarketsColumn({
  selectedAgentId,
  className = "",
}: TrackerMarketsColumnProps) {
  const refetchTrigger = useAppSelector((state) => state.positions.refetchTrigger);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedAgentId == null) {
      queueMicrotask(() => {
        setPositions([]);
      });
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });
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
  }, [selectedAgentId, refetchTrigger]);

  const marketEntries = Array.from(
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
        ) : marketEntries.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No positions yet; markets will appear after trading.
          </p>
        ) : (
          <ul className="space-y-0 list-none p-0 m-0">
            {marketEntries.map(([marketId, market]) => (
              <li key={marketId}>
                <MiniMarketCard
                  market={positionMarketToMarket(marketId, market)}
                  showActions={false}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
