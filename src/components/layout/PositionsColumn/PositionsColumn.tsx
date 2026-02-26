"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addRecent } from "@/store/slices/recentSlice";
import { getPositions } from "@/lib/api/positions";
import { LiveTimeDisplay } from "@/components/LiveTimeDisplay";
import { formatOutcomePrice, formatCollateral } from "@/lib/formatNumbers";
import type { Position, PositionStatus } from "@/types/position.types";

const POSITIONS_LIMIT = 20;

export interface PositionsColumnProps {
  /** Filter by status. Default OPEN. */
  status?: PositionStatus;
  /** Max positions to fetch. Default 20. */
  limit?: number;
  /** Filter by marketId. */
  marketId?: string;
  /** Filter by userId. */
  userId?: string;
  /** Filter by agentId. */
  agentId?: string;
  /** Filter by wallet address. */
  address?: string;
  className?: string;
}

function positionStatusColor(status: PositionStatus): string {
  switch (status) {
    case "OPEN":
      return "text-success";
    case "CLOSED":
      return "text-muted";
    case "LIQUIDATED":
      return "text-danger";
    default:
      return "text-muted";
  }
}

function PositionsColumnSkeleton() {
  return (
    <ul className="space-y-0" aria-label="Positions loading">
      {Array.from({ length: 5 }, (_, i) => (
        <li
          key={i}
          className="border-b border-border bg-surface p-3 last:border-b-0"
        >
          <div className="mb-1.5 h-3 w-2/3 animate-pulse rounded bg-muted/50" />
          <div className="mb-1.5 h-3 w-1/2 animate-pulse rounded bg-muted/50" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
        </li>
      ))}
    </ul>
  );
}

export function PositionsColumn({
  status = "OPEN",
  limit = POSITIONS_LIMIT,
  marketId,
  userId,
  agentId,
  address,
  className = "",
}: PositionsColumnProps) {
  const dispatch = useAppDispatch();
  const refetchTrigger = useAppSelector((state) => state.positions.refetchTrigger);
  const [positions, setPositions] = useState<Position[]>([]);
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
    getPositions({
      status,
      limit,
      marketId,
      userId,
      agentId,
      address,
    })
      .then((res) => {
        if (!cancelled) {
          setPositions(res.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load positions"
          );
          setPositions([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status, limit, marketId, userId, agentId, address, refetchTrigger]);

  if (loading && positions.length === 0) {
    return (
      <div className={className}>
        <PositionsColumnSkeleton />
      </div>
    );
  }

  if (error != null) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`.trim()}>
        {error}
      </p>
    );
  }

  if (positions.length === 0) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`.trim()}>
        No {status.toLowerCase()} positions. Open a trade to see positions here.
      </p>
    );
  }

  return (
    <article
      className={`flex flex-col ${className}`.trim()}
      aria-label="Positions list"
    >
      <ul className="space-y-0">
        {positions.map((pos) => {
          const sideClass =
            pos.side === "LONG" ? "text-success" : "text-danger";
          const avgPriceStr = formatOutcomePrice(pos.avgPrice);
          const collateralStr = formatCollateral(pos.collateralLocked);
          return (
            <li key={pos.id}>
              <section className="border-b border-border bg-surface p-3 transition-colors last:border-b-0 hover:bg-muted/30">
                <h4 className="text-sm font-semibold text-foreground">
                  <Link
                    href={`/market/${pos.marketId}`}
                    onClick={() =>
                      dispatch(
                        addRecent({
                          type: "market",
                          id: pos.marketId,
                          label: pos.market?.name ?? pos.marketId.slice(0, 8),
                        })
                      )
                    }
                    className="line-clamp-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    {pos.market?.name ?? pos.marketId.slice(0, 8)}
                  </Link>
                </h4>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className={sideClass}>{pos.side}</span>
                  <span className={positionStatusColor(pos.status)}>
                    {pos.status}
                  </span>
                  <span className="text-muted">
                    Outcome {pos.outcomeIndex}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    <span className="font-medium text-foreground">Avg</span>{" "}
                    {avgPriceStr}
                  </span>
                  <span>
                    <span className="font-medium text-foreground">Size</span>{" "}
                    {collateralStr}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-muted">
                  <LiveTimeDisplay createdAt={pos.updatedAt} />
                </p>
              </section>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
