"use client";

import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarkets } from "@/store/slices/marketsSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { MiniMarketCard } from "../MiniMarketCard";
import { MiniMarketCardSkeleton } from "../MiniMarketCard";
import type { Market } from "@/types/market.types";

export interface MiniMarketsContainerProps {
  onBuy?: (market: Market) => void;
  onSell?: (market: Market) => void;
  className?: string;
}

const SKELETON_COUNT = 6;

export function MiniMarketsContainer({
  onBuy,
  onSell,
  className = "",
}: MiniMarketsContainerProps) {
  const dispatch = useAppDispatch();
  const { list, listLoading, error } = useAppSelector((state) => state.markets);
  const marketIds = useMemo(() => list.map((m) => m.id), [list]);

  useMarketSocket({
    marketIds,
    subscribeToList: true,
    enabled: true,
  });

  useEffect(() => {
    if (list.length === 0) {
      void dispatch(fetchMarkets({ status: "OPEN", limit: 24 }));
    }
  }, [dispatch, list.length]);

  if (listLoading && list.length === 0) {
    return (
      <div
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
        aria-label="Loading markets"
      >
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <MiniMarketCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error != null && list.length === 0) {
    return (
      <p
        className={`text-sm text-danger ${className}`}
        role="alert"
      >
        {error}
      </p>
    );
  }

  if (list.length === 0) {
    return (
      <p className={`text-sm text-muted ${className}`}>
        No open markets.
      </p>
    );
  }

  return (
    <div
      className={`${className}`}
      aria-label="Markets list"
    >
      {list.map((market) => (
        <MiniMarketCard
          key={market.id}
          market={market}
          onBuy={onBuy}
          onSell={onSell}
        />
      ))}
    </div>
  );
}
