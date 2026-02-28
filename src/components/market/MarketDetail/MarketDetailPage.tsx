"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarketById } from "@/store/slices/marketsSlice";
import { addRecent } from "@/store/slices/recentSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { getActivities, getMarketHolders, getMarketTraders } from "@/lib/api/activities";
import { getMarketPrices } from "@/lib/api/prices";
import type { ActivityItem, MarketHolderItem, MarketTraderItem } from "@/types/activity.types";
import type { MarketPricesResponse } from "@/types/prices.types";
import { MarketLeftColumn } from "./MarketLeftColumn";
import { MarketDetailLayout } from "./MarketDetailLayout";
import { OutcomeProbabilityChart } from "./OutcomeProbabilityChart";
import { OrderBookDepthChart } from "./OrderBookDepthChart";
import { MarketDetailTabs } from "./MarketDetailTabs";
import { MarketTradePanel } from "./MarketTradePanel";
import { MarketInfoPanel } from "./MarketInfoPanel";
import { MarketOrderBook } from "../MarketOrderBook";
import Image from "next/image";
import { formatCollateral, USDC_DECIMALS } from "@/lib/formatNumbers";
import { useActiveAccount } from "thirdweb/react";
import { getWalletBalances } from "@/lib/balances";

export interface MarketDetailPageProps {
  marketId: string;
}

function formatVolume(value: string | undefined): string {
  if (value == null || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (n >= 1_000_000) return `${formatCollateral(n / 1_000_000)}M`;
  if (n >= 1_000) return `${formatCollateral(n / 1_000)}K`;
  return formatCollateral(n);
}

export function MarketDetailPage({ marketId }: MarketDetailPageProps) {
  const dispatch = useAppDispatch();
  const { selectedMarket, detailLoading, error } = useAppSelector((state) => state.markets);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [holders, setHolders] = useState<MarketHolderItem[]>([]);
  const [traders, setTraders] = useState<MarketTraderItem[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPricesResponse | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const account = useActiveAccount();
  // const availableBalanceUsdc = useMemo(() => getWalletBalances(account?.address ?? ""), [account?.address]);
  // console.log("availableBalanceUsdc", availableBalanceUsdc);
  useEffect(() => {
    const fetchAvailableBalance = async () => {
      if (account?.address) {
        const balances = await getWalletBalances(account?.address ?? "");
        setAvailableBalance(Number(balances.usdc) / 10 ** USDC_DECIMALS);
      }
    };
    fetchAvailableBalance();
  }, [account?.address]);


  useMarketSocket({ marketId, enabled: Boolean(marketId) });

  useEffect(() => {
    if (marketId) void dispatch(fetchMarketById(marketId));
  }, [marketId, dispatch]);

  const fetchDetails = useCallback(() => {
    if (!marketId) return;
    setActivities([]);
    setHolders([]);
    setTraders([]);
    getActivities({ marketId, limit: 50 })
      .then((res) => {
        const list = res.data ?? [];
        const forThisMarket = list.filter((item) => {
          const p = item.payload as { marketId?: string };
          return p.marketId === marketId;
        });
        setActivities(forThisMarket);
      })
      .catch(() => setActivities([]));
    getMarketHolders(marketId)
      .then((res) => setHolders(res.data ?? []))
      .catch(() => setHolders([]));
    getMarketTraders(marketId)
      .then((res) => setTraders(res.data ?? []))
      .catch(() => setTraders([]));
    getMarketPrices(marketId)
      .then(setMarketPrices)
      .catch(() => setMarketPrices(null));
  }, [marketId]);

  useEffect(() => {
    queueMicrotask(() => fetchDetails());
  }, [fetchDetails]);

  const market = selectedMarket?.id === marketId ? selectedMarket : null;

  useEffect(() => {
    if (market?.id != null && market?.name != null) {
      const id = market.id;
      const label = market.name;
      queueMicrotask(() =>
        dispatch(addRecent({ type: "market", id, label }))
      );
    }
  }, [market?.id, market?.name, dispatch]);

  const holdersCount = market?.uniqueStakersCount ?? holders.length;

  if (detailLoading && market == null) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(180px,1fr)_minmax(0,2fr)_minmax(280px,1fr)]">
          <aside className="flex flex-col overflow-hidden rounded-lg border border-border bg-surface">
            <div className="h-10 shrink-0 animate-pulse rounded-t-lg bg-muted/50" />
            <div className="min-h-[200px] flex-1 animate-pulse rounded-b-lg bg-muted/30" />
          </aside>
          <section className="flex flex-col gap-3 overflow-hidden">
            <div className="h-14 shrink-0 animate-pulse rounded-lg border border-border bg-surface" />
            <div className="min-h-[280px] flex-1 animate-pulse rounded-lg border border-border bg-surface" />
            <div className="min-h-[120px] shrink-0 animate-pulse rounded-lg border border-border bg-surface" />
          </section>
          <aside className="flex flex-col gap-3 overflow-hidden">
            <div className="min-h-[320px] animate-pulse rounded-lg border border-border bg-surface" />
            <div className="min-h-[180px] animate-pulse rounded-lg border border-border bg-surface" />
          </aside>
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

  const sidebar = (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-2">
      <MarketLeftColumn marketId={marketId} marketPrices={marketPrices} className="min-h-0 flex-1" />
    </div>
  );

  const main = (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto gap-3 p-2">
      <div className="flex items-center gap-3 shrink-0">
        {market.imageUrl != null ? (
          <Image
            src={market.imageUrl}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
            unoptimized
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
      <OutcomeProbabilityChart
        marketId={marketId}
        marketPrices={marketPrices}
        className="shrink-0"
      />
      <MarketDetailTabs
        marketId={marketId}
        holdersCount={holdersCount}
        activityItems={activities}
        holders={holders}
        traders={traders}
        className="min-h-0 flex-1"
      />
    </div>
  );

  const trade = (
    <div className="flex min-w-0 flex-1 flex-col overflow-auto gap-3 p-2">
      <MarketTradePanel
        marketId={marketId}
        marketStatus={market.status}
        outcomes={market.outcomes}
        marketPrices={marketPrices}
        availableBalance={availableBalance}
      />
      <OrderBookDepthChart marketId={marketId} outcomeIndex={0} className="shrink-0" />
      <MarketOrderBook marketId={marketId} maxRows={8} className="shrink-0" />
      <MarketInfoPanel market={market} marketPrices={marketPrices} className="shrink-0" />
    </div>
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <MarketDetailLayout sidebar={sidebar} main={main} trade={trade} className="min-h-0 flex-1" />
    </main>
  );
}
