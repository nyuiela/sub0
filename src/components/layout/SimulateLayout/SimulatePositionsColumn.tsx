"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { getPositions } from "@/lib/api/positions";
import type { Position } from "@/types/position.types";
import { getDiceBearAvatarUrl } from "@/lib/avatar";

export interface SimulatePositionsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

const POSITION_IMAGE_SIZE = 48;
const POSITIONS_LIMIT = 50;

export function SimulatePositionsColumn({
  selectedAgentId,
  className = "",
}: SimulatePositionsColumnProps) {
  const refetchTrigger = useAppSelector((state) => state.positions.refetchTrigger);
  const [positions, setPositions] = useState<Position[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!selectedAgentId) {
      setPositions([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getPositions({
        agentId: selectedAgentId,
        chainKey: "tenderly",
        status: "OPEN",
        includeLatestReason: true,
        limit: POSITIONS_LIMIT,
        offset: 0,
      });
      setPositions(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load positions");
      setPositions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    void fetchPositions();
  }, [fetchPositions, refetchTrigger]);

  if (selectedAgentId == null) {
    return (
      <section className={className} aria-label="Markets with positions">
        <p className="text-xs text-muted-foreground">
          Select an agent to see simulate positions.
        </p>
      </section>
    );
  }

  return (
    <section className={className} aria-label="Markets with positions">
      <p className="mb-2 text-xs text-muted-foreground">
        Open positions from simulate trading. Each card shows the agent&apos;s brief reason when available.
      </p>
      {error != null && (
        <p className="mb-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : positions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No open positions yet. After the agent analyses and trades in simulate, positions will appear here.
        </p>
      ) : (
        <ul className="space-y-2" role="list">
          {positions.map((pos) => (
            <li
              key={pos.id}
              className="flex items-start gap-3 rounded border border-border bg-surface p-2"
            >
              <figure className="h-12 w-12 shrink-0 overflow-hidden rounded-sm" aria-hidden>
                <img
                  src={getDiceBearAvatarUrl(pos.marketId, "market")}
                  alt=""
                  width={POSITION_IMAGE_SIZE}
                  height={POSITION_IMAGE_SIZE}
                  className="h-12 w-12 object-cover"
                  loading="lazy"
                />
              </figure>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {pos.market?.name ?? pos.marketId}
                </span>
                <span className="text-xs text-muted-foreground">
                  {pos.side} · outcome {pos.outcomeIndex} · {pos.collateralLocked} locked
                </span>
                {pos.lastReason != null && pos.lastReason !== "" && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {pos.lastReason}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && total > positions.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          {total} total position(s)
        </p>
      )}
    </section>
  );
}
