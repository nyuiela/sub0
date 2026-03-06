"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setOrderBookForMarket } from "@/store/slices/marketsSlice";
import { selectOrderBookByMarketId } from "@/store/slices/marketsSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { getMarketById } from "@/lib/api/markets";
import { getAgentReasoning, getAgentEnqueuedMarkets } from "@/lib/api/agents";
import type { AgentReasoning } from "@/types/agent.types";
import type { OrderBookLevel } from "@/types/market.types";
import { formatOutcomePrice, formatOutcomeQuantity } from "@/lib/formatNumbers";
import { SimulateProbabilityChart } from "./SimulateProbabilityChart";
import { SimulatePositionsColumn } from "./SimulatePositionsColumn";
import { List, FileText, Scale } from "lucide-react";

export interface SimulateProbabilityChartColumnProps {
  selectedAgentId: string | null;
  simulationId?: string | null;
  className?: string;
}

type TabId = "bidTable" | "positions" | "decisions";

export function SimulateProbabilityChartColumn({
  selectedAgentId,
  simulationId = null,
  className = "",
}: SimulateProbabilityChartColumnProps) {
  const [activeTab, setActiveTab] = useState<TabId>("bidTable");
  const [firstMarketId, setFirstMarketId] = useState<string | null>(null);
  const simulateEnqueuedListVersion = useAppSelector(
    (state) => state.layout.simulateEnqueuedListVersion
  );

  useEffect(() => {
    if (!selectedAgentId) {
      setFirstMarketId(null);
      return;
    }
    getAgentEnqueuedMarkets(selectedAgentId, {
      limit: 1,
      offset: 0,
      chainKey: "tenderly",
      simulationId: simulationId ?? undefined,
    })
      .then((res) => {
        const id = res.data?.[0]?.marketId ?? null;
        setFirstMarketId(id);
      })
      .catch(() => setFirstMarketId(null));
  }, [selectedAgentId, simulationId, simulateEnqueuedListVersion]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="mb-3">
        <SimulateProbabilityChartWithData
          marketId={firstMarketId}
          hasAgent={!!selectedAgentId}
          height={200}
          className="mb-2"
        />
      </div>

      <div className="flex border-b border-border mb-3">
        <button
          type="button"
          onClick={() => setActiveTab("bidTable")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === "bidTable"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Scale className="h-3.5 w-3.5" />
          Order Book
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("positions")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === "positions"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <List className="h-3.5 w-3.5" />
          Positions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("decisions")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === "decisions"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Decisions
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "bidTable" ? (
          <SimulateOrderBook marketId={firstMarketId} hasAgent={!!selectedAgentId} />
        ) : activeTab === "positions" ? (
          <SimulatePositionsColumn
            selectedAgentId={selectedAgentId}
            className="h-full"
          />
        ) : (
          <SimulateDecisions selectedAgentId={selectedAgentId} />
        )}
      </div>
    </div>
  );
}

function deriveProbabilityFromOrderBook(bids: OrderBookLevel[], asks: OrderBookLevel[]): number | null {
  const bestBid = bids[0]?.price;
  const bestAsk = asks[0]?.price;
  if (bestBid != null && bestAsk != null) {
    const bid = parseFloat(bestBid);
    const ask = parseFloat(bestAsk);
    if (Number.isFinite(bid) && Number.isFinite(ask)) return (bid + ask) / 2;
  }
  if (bestBid != null) {
    const bid = parseFloat(bestBid);
    if (Number.isFinite(bid)) return bid;
  }
  if (bestAsk != null) {
    const ask = parseFloat(bestAsk);
    if (Number.isFinite(ask)) return ask;
  }
  return null;
}

function SimulateProbabilityChartWithData({
  marketId,
  height,
  className,
}: { marketId: string | null; hasAgent?: boolean; height: number; className?: string }) {
  const dispatch = useAppDispatch();
  useMarketSocket({ marketId: marketId ?? "", enabled: Boolean(marketId) });
  const snapshot = useAppSelector((state) =>
    selectOrderBookByMarketId(state, marketId ?? "", 0)
  );
  const [dataPoints, setDataPoints] = useState<{ timestamp: number; probability: number }[]>([]);
  const PROBABILITY_CHART_MAX = 100;

  useEffect(() => {
    if (!marketId) return;
    getMarketById(marketId)
      .then((market) => {
        const ob = market?.orderBookSnapshot;
        if (ob?.marketId && Array.isArray(ob.bids) && Array.isArray(ob.asks)) {
          dispatch(setOrderBookForMarket({
            marketId: ob.marketId,
            outcomeIndex: ob.outcomeIndex ?? 0,
            bids: ob.bids,
            asks: ob.asks,
            timestamp: ob.timestamp ?? Date.now(),
          }));
        }
      })
      .catch(() => {});
  }, [marketId, dispatch]);

  useEffect(() => {
    if (!marketId) {
      setDataPoints([]);
      return;
    }
    const prob = deriveProbabilityFromOrderBook(snapshot?.bids ?? [], snapshot?.asks ?? []);
    if (prob == null) return;
    const now = Date.now();
    setDataPoints((prev) => {
      const next = [...prev, { timestamp: now, probability: prob }];
      return next.length > PROBABILITY_CHART_MAX ? next.slice(-PROBABILITY_CHART_MAX) : next;
    });
  }, [marketId, snapshot?.bids, snapshot?.asks, snapshot?.timestamp]);

  const data = useMemo(() => {
    if (dataPoints.length > 0) return dataPoints;
    return [{ timestamp: Date.now(), probability: 0.5 }];
  }, [dataPoints]);

  return (
    <SimulateProbabilityChart
      data={data}
      title="Implied Probability"
      subtitle="Live backtest simulation tracking"
      height={height}
      className={className ?? ""}
    />
  );
}

function SimulateOrderBook({ marketId, hasAgent }: { marketId: string | null; hasAgent: boolean }) {
  const dispatch = useAppDispatch();
  useMarketSocket({ marketId: marketId ?? "", enabled: Boolean(marketId) });
  const snapshot = useAppSelector((state) =>
    selectOrderBookByMarketId(state, marketId ?? "", 0)
  );
  const [hydrated, setHydrated] = useState(false);

  const hydrateOrderBook = useCallback(async () => {
    if (!marketId) return;
    try {
      const market = await getMarketById(marketId);
      const ob = market?.orderBookSnapshot;
      if (ob?.marketId && Array.isArray(ob.bids) && Array.isArray(ob.asks)) {
        dispatch(setOrderBookForMarket({
          marketId: ob.marketId,
          outcomeIndex: ob.outcomeIndex ?? 0,
          bids: ob.bids,
          asks: ob.asks,
          timestamp: ob.timestamp ?? Date.now(),
        }));
      }
      setHydrated(true);
    } catch {
      setHydrated(true);
    }
  }, [marketId, dispatch]);

  useEffect(() => {
    if (!marketId) {
      setHydrated(false);
      return;
    }
    void hydrateOrderBook();
  }, [marketId, hydrateOrderBook]);

  if (!hasAgent) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an agent to view order book.
      </p>
    );
  }

  if (!marketId) {
    return (
      <p className="text-sm text-muted-foreground">
        Start a simulation. The order book for the first queued market will appear here as markets are enqueued.
      </p>
    );
  }

  const bids = snapshot?.bids ?? [];
  const asks = snapshot?.asks ?? [];

  if (!hydrated && bids.length === 0 && asks.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading order book...</p>;
  }

  return (
    <article className="rounded-md bg-surface p-2" aria-label={`Order book for market ${marketId}`}>
      <header className="mb-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Order Book</h4>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <OrderBookSide levels={bids} side="bid" maxRows={8} />
        <OrderBookSide levels={asks} side="ask" maxRows={8} />
      </div>
    </article>
  );
}

function OrderBookSide({
  levels,
  side,
  maxRows,
}: { levels: OrderBookLevel[]; side: "bid" | "ask"; maxRows: number }) {
  const slice = levels.slice(0, maxRows);
  return (
    <section aria-label={`Order book ${side}s`}>
      <h5 className={`text-xs font-medium mb-1 ${side === "bid" ? "text-success" : "text-danger"}`}>
        {side === "bid" ? "Bids" : "Asks"}
      </h5>
      <div className="rounded border border-border bg-surface p-2">
        {slice.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No {side}s</p>
        ) : (
          <div className="space-y-1">
            {slice.map((level, i) => (
              <div
                key={`${side}-${level.price}-${i}`}
                className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0"
              >
                <span className={`font-mono ${side === "bid" ? "text-success" : "text-danger"}`}>
                  {formatOutcomePrice(level.price)}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatOutcomeQuantity(level.quantity)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function SimulateDecisions({ selectedAgentId }: { selectedAgentId: string | null }) {
  const [items, setItems] = useState<AgentReasoning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReasoning = useCallback(async () => {
    if (!selectedAgentId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getAgentReasoning(selectedAgentId, {
        limit: 50,
        offset: 0,
      });
      setItems(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load decisions");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    void fetchReasoning();
  }, [fetchReasoning]);

  useEffect(() => {
    if (!selectedAgentId) return;
    const interval = setInterval(() => void fetchReasoning(), 15000);
    return () => clearInterval(interval);
  }, [selectedAgentId, fetchReasoning]);

  if (!selectedAgentId) {
    return (
      <p className="text-sm text-muted-foreground">Select an agent to view decisions.</p>
    );
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading decisions...</p>;
  if (error) return <p className="text-sm text-danger" role="alert">{error}</p>;
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Continuous stream of agent decisions (positions taken, trades, holds, updates) with reasons. Will appear as the simulation runs.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Agent Decisions (live stream)</h4>
      <ul className="space-y-2" role="list">
        {items.map((r) => (
          <li key={r.id}>
            <DecisionItem
              timestamp={r.createdAt}
              action={mapAction(r.actionTaken)}
              market={r.marketName ?? r.marketId}
              reasoning={r.tradeReason ?? r.reasoning ?? ""}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function mapAction(action: string | undefined): "BUY" | "SELL" | "HOLD" {
  if (!action) return "HOLD";
  const a = String(action).toLowerCase();
  if (a === "buy" || a === "long") return "BUY";
  if (a === "sell" || a === "short") return "SELL";
  return "HOLD";
}

function DecisionItem({
  timestamp,
  action,
  market,
  reasoning,
}: { timestamp: string; action: "BUY" | "SELL" | "HOLD"; market: string; reasoning: string }) {
  const actionColor = action === "BUY" ? "text-success" : action === "SELL" ? "text-danger" : "text-muted-foreground";
  const formattedTime = (() => {
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return timestamp;
    }
  })();

  return (
    <div className="rounded border border-border bg-surface p-2 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground">{formattedTime}</span>
        <span className={`font-semibold ${actionColor}`}>{action}</span>
      </div>
      <p className="text-foreground font-medium mb-1 truncate" title={market}>{market}</p>
      <p className="text-muted-foreground line-clamp-3">{reasoning || "No reasoning provided"}</p>
    </div>
  );
}
