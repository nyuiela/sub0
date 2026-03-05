"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarketById } from "@/store/slices/marketsSlice";
import { addRecent } from "@/store/slices/recentSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { getActivities, getMarketHolders, getMarketTraders } from "@/lib/api/activities";
import { getMarketPrices } from "@/lib/api/prices";
import type { ActivityItem, MarketHolderItem, MarketTraderItem } from "@/types/activity.types";
import type { MarketPricesResponse } from "@/types/prices.types";
import type { Market } from "@/types/market.types";
import { MarketLeftColumn } from "./MarketLeftColumn";
import { MarketDetailLayout } from "./MarketDetailLayout";
import { OutcomeProbabilityChart } from "./OutcomeProbabilityChart";
import { OrderBookDepthChart } from "./OrderBookDepthChart";
import { MarketDetailTabs } from "./MarketDetailTabs";
import { MarketTradePanel } from "./MarketTradePanel";
import { MarketInfoPanel } from "./MarketInfoPanel";
import { MarketOrderBook } from "../MarketOrderBook";
import { MarketLmsrPricingPanel } from "../MarketLmsrPricingPanel";
import Image from "next/image";
import { formatCollateral, USDC_DECIMALS } from "@/lib/formatNumbers";
import { useActiveAccount } from "thirdweb/react";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import { getWalletBalances } from "@/lib/balances";
import Link from "next/link";

export interface MarketDetailPageProps {
  marketId: string;
}

function formatVolume(value: string | undefined): string {
  if (value == null || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (n >= 1_000_000) return `${formatCollateral(n / 1_000_000)}M`;
  if (n >= 1_000) return `${formatCollateral(n / 1_000)}K`;
  return formatCollateral(n.toFixed(0));
}

export function MarketDetailPage({ marketId }: MarketDetailPageProps) {
  const dispatch = useAppDispatch();
  const account = useActiveAccount();

  // 1. We extract 'list' as a fallback data source
  const { selectedMarket, detailLoading, list } = useAppSelector((state) => state.markets);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [holders, setHolders] = useState<MarketHolderItem[]>([]);
  const [traders, setTraders] = useState<MarketTraderItem[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPricesResponse | null>(null);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [positions, setPositions] = useState<any[]>([]);

  // 2. The Local Cache: Prevents the UI from wiping during a WS state transition
  const [cachedMarket, setCachedMarket] = useState<Market | null>(null);
  // const availableBalanceUsdc = useMemo(() => getWalletBalances(account?.address ?? ""), [account?.address]);
  // console.log("availableBalanceUsdc", availableBalanceUsdc);
  useEffect(() => {
    const fetchAvailableBalance = async () => {
      if (account?.address) {
        const balances = await getWalletBalances(account.address);
        setAvailableBalance(Number(balances.usdc) / 10 ** USDC_DECIMALS);
      }
    };
    fetchAvailableBalance();
  }, [account?.address]);


  useMarketSocket({
    marketId,
    enabled: Boolean(marketId),
    subscribeToActivity: true,
    subscribeToAi: true,
    userId: account?.address,
    onActivityLog: () => {
      // Refetch activities when new activity is received
      getActivities({ marketId, limit: 50 })
        .then((res) => {
          const forThisMarket = (res.data ?? []).filter(
            (item) => (item.payload as { marketId?: string }).marketId === marketId
          );
          setActivities(forThisMarket);
        })
        .catch(() => setActivities([]));
    },
    onPositionUpdated: () => {
      // Refetch positions when updated
      const fetchPositions = async () => {
        if (!account?.address || !marketId) return;
        try {
          const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
          const data = await fetch(`${base}/api/positions/${marketId}/${account.address}`);
          const json = await data.json();
          setPositions(json.balances || []);
        } catch (error) {
          console.error("Failed to fetch positions:", error);
        }
      };
      fetchPositions();
    },
  });

  useEffect(() => {
    if (marketId) {
      dispatch(fetchMarketById(marketId));
    }
  }, [marketId, dispatch]);

  const fetchDetails = useCallback(() => {
    if (!marketId) return;

    getActivities({ marketId, limit: 50 })
      .then((res) => {
        const forThisMarket = (res.data ?? []).filter(
          (item) => (item.payload as { marketId?: string }).marketId === marketId
        );
        setActivities(forThisMarket);
      })
      .catch(() => setActivities([]));

    getMarketHolders(marketId).then((res) => setHolders(res.data ?? [])).catch(() => setHolders([]));
    getMarketTraders(marketId).then((res) => setTraders(res.data ?? [])).catch(() => setTraders([]));
    getMarketPrices(marketId).then(setMarketPrices).catch(() => setMarketPrices(null));
  }, [marketId]);


  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // 3. Robust Resolution: Case-insensitive ID checking with array fallback
  const resolvedMarket = useMemo(() => {
    if (!marketId) return null;
    const targetId = String(marketId).toLowerCase();

    // Check primary selected state first
    if (selectedMarket && String(selectedMarket.id).toLowerCase() === targetId) {
      return selectedMarket;
    }

    // Fallback: If WS updated the main list but didn't update selectedMarket
    if (list && list.length > 0) {
      const foundInList = list.find((m) => String(m.id).toLowerCase() === targetId);
      if (foundInList) return foundInList as Market;
    }

    return null;
  }, [selectedMarket, list, marketId]);

  // 4. Update cache ONLY when we have a valid resolved market
  useEffect(() => {
    if (resolvedMarket) {
      setCachedMarket(resolvedMarket);
    }
  }, [resolvedMarket]);

  // 5. Final Source of Truth: Use resolved, otherwise fallback to cache
  const market = resolvedMarket || cachedMarket;


  useEffect(() => {
    if (market?.id && market?.name) {
      dispatch(addRecent({ type: "market", id: market.id, label: market.name }));
    }
  }, [market?.id, market?.name, dispatch]);

  // Pro-tip: Added isMounted safety check to prevent memory leaks on unmount
  useEffect(() => {
    let isMounted = true;
    const fetchPositions = async () => {
      if (!account?.address || !marketId) return;
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const data = await fetch(`${base}/api/positions/${marketId}/${account.address}`);
        const json = await data.json();
        if (isMounted) setPositions(json.balances || []);
      } catch (error) {
        console.error("Failed to fetch positions:", error);
      }
    };
    fetchPositions();
    return () => { isMounted = false; };
  }, [marketId, account?.address]);

  if (detailLoading && !market) {
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

  // if (!market && !detailLoading) {
  //   return <NotFoundView />;
  // }
  // if (error != null && market == null) {
  //   return (
  //     <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
  //       <p className="text-danger" role="alert">
  //         {error}
  //       </p>
  //       <Link href="/" className="text-sm text-primary hover:underline">
  //         Back to markets
  //       </Link>
  //     </main>
  //   );
  // }

  if (!market && !detailLoading) {
    return (
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        <div className="rounded-lg border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">Market Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {/* The market with ID "{marketId}" could not be found or failed to load. */}
            The market could not be found or failed to load.
          </p>
          {/* {error && (
            <p className="text-sm text-danger mb-4">
              Error: {error}
            </p>
          )} */}
          <div className="flex gap-3">
            <button
              onClick={() => dispatch(fetchMarketById(marketId))}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Retry
            </button>
            <Link href="/" className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/90 transition-colors">
              Back to Markets
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const holdersCount = market?.uniqueStakersCount ?? holders.length;
  const volumeFormatted = formatVolume((Number(market?.volume || 0) / 10 ** USDC_DECIMALS).toString());

  const sidebar = (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-2">
      <MarketLeftColumn marketId={marketId} marketPrices={marketPrices} className="min-h-0 flex-1" />
    </div>
  );

  const main = (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto gap-3 p-2">
      <div className="flex items-center gap-3 shrink-0">
        {market?.imageUrl != null ? (
          <Image
            src={market.imageUrl}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
            unoptimized
          />
        ) : (
          <Image
            src={getDiceBearAvatarUrl(marketId, "market")}
            alt=""
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
            loading="lazy"
          />
        )}
        <div>
          <h1 className="text-lg font-semibold text-foreground">{market?.name}</h1>
          <p className="text-sm text-muted-foreground">
            Vol {volumeFormatted} · Holders {holdersCount} · Trades {market?.totalTrades ?? 0}
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
      {market ? (
        <MarketTradePanel
          marketId={marketId}
          questionId={market.questionId || market.conditionId || marketId}
          marketStatus={market.status}
          outcomes={market.outcomes}
          marketPrices={marketPrices}
          availableBalance={availableBalance}
          positions={positions}
        />
      ) : (
        <div className="rounded-lg border border-border bg-surface p-6">
          <p className="text-muted-foreground">Market data loading...</p>
        </div>
      )}
      {/* {market && (
        <MarketLmsrPricingPanel
          marketId={marketId}
          questionId={market.questionId || market.conditionId || marketId}
          outcomes={(market.outcomes as string[]) ?? ["Yes", "No"]}
          className="shrink-0"
        />
      )} */}
      <OrderBookDepthChart marketId={marketId} outcomeIndex={0} className="shrink-0" />
      <MarketOrderBook marketId={marketId} maxRows={8} className="shrink-0" />
      <MarketInfoPanel market={market!} marketPrices={marketPrices} className="shrink-0" />
    </div>
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-auto p-4">
      <MarketDetailLayout sidebar={sidebar} main={main} trade={trade} className="min-h-0 flex-1" />
    </main>
  );
}
