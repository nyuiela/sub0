"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarketById } from "@/store/slices/marketsSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { getActivities, getMarketHolders, getMarketTraders } from "@/lib/api/activities";
import type { ActivityItem, MarketHolderItem, MarketTraderItem } from "@/types/activity.types";
import { MarketLeftColumn } from "./MarketLeftColumn";
import { TradingChart } from "./TradingChart";
import { MarketDetailTabs } from "./MarketDetailTabs";
import { MarketTradePanel } from "./MarketTradePanel";
import { MarketInfoPanel } from "./MarketInfoPanel";
import { MarketOrderBook } from "../MarketOrderBook";

export interface MarketDetailPageProps {
  marketId: string;
}

function formatVolume(value: string | undefined): string {
  if (value == null || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

export function MarketDetailPage({ marketId }: MarketDetailPageProps) {
  const dispatch = useAppDispatch();
  const { selectedMarket, detailLoading, error } = useAppSelector((state) => state.markets);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [holders, setHolders] = useState<MarketHolderItem[]>([]);
  const [traders, setTraders] = useState<MarketTraderItem[]>([]);

  useMarketSocket({ marketId, enabled: Boolean(marketId) });

  useEffect(() => {
    if (marketId) void dispatch(fetchMarketById(marketId));
  }, [marketId, dispatch]);

  const fetchDetails = useCallback(() => {
    if (!marketId) return;
    getActivities({ marketId, limit: 50 })
      .then((res) => setActivities(res.data))
      .catch(() => setActivities([]));
    getMarketHolders(marketId)
      .then((res) => setHolders(res.data))
      .catch(() => setHolders([]));
    getMarketTraders(marketId)
      .then((res) => setTraders(res.data))
      .catch(() => setTraders([]));
  }, [marketId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const market = selectedMarket?.id === marketId ? selectedMarket : null;
  const holdersCount = market?.uniqueStakersCount ?? holders.length;

  if (detailLoading && market == null) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
        <header className="mb-4 h-14 animate-pulse rounded-lg bg-muted" />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_minmax(280px,1fr)]">
          <div className="min-h-[200px] animate-pulse rounded-lg bg-muted" />
          <div className="flex flex-col gap-4">
            <div className="min-h-[280px] animate-pulse rounded-lg bg-muted" />
            <div className="min-h-[200px] animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="flex flex-col gap-4">
            <div className="min-h-[320px] animate-pulse rounded-lg bg-muted" />
            <div className="min-h-[180px] animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </main>
    );
  }

  if (error != null && market == null) {
    return (
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <p className="text-danger" role="alert">
          {error}
        </p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Back to markets
        </Link>
      </main>
    );
  }

  if (market == null) {
    return (
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <p className="text-muted-foreground">Market not found.</p>
        <Link href="/" className="text-sm text-primary hover:underline">
          Back to markets
        </Link>
      </main>
    );
  }

  const volume = market.totalVolume ?? market.volume ?? "0";
  const volumeFormatted = formatVolume(volume);

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          {market.imageUrl != null ? (
            <img
              src={market.imageUrl}
              alt=""
              className="h-10 w-10 rounded-full object-cover"
              width={40}
              height={40}
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
              {market.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">{market.name}</h1>
            <p className="text-sm text-muted-foreground">
              Vol {volumeFormatted} · Holders {holdersCount} · Trades {market.totalTrades ?? 0}
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to markets
        </Link>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_minmax(280px,1fr)]">
        <div className="flex min-h-0 flex-col lg:min-h-[400px]">
          <MarketLeftColumn marketId={marketId} className="min-h-0 flex-1" />
        </div>

        <div className="flex min-h-0 flex-col gap-1">
          <TradingChart marketId={marketId} className="min-h-[280px] shrink-0" />
          <MarketDetailTabs
            marketId={marketId}
            holdersCount={holdersCount}
            activityItems={activities}
            holders={holders}
            traders={traders}
            className="min-h-0 flex-1"
          />
        </div>

        <div className="flex min-h-0 flex-col gap-1">
          <MarketTradePanel
            marketId={marketId}
            marketStatus={market.status}
            outcomes={market.outcomes}
            className="h-full flex-1"
          />
          <MarketOrderBook marketId={marketId} maxRows={8} className="shrink-0" />
          <MarketInfoPanel market={market} className="shrink-0" />
        </div>
      </div>
    </main>
  );
}
