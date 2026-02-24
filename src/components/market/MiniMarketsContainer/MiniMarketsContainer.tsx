"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarkets } from "@/store/slices/marketsSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { getMyAgents, enqueueAgentMarket } from "@/lib/api/agents";
import { MiniMarketCard } from "../MiniMarketCard";
import { MiniMarketCardSkeleton } from "../MiniMarketCard";
import type { Market } from "@/types/market.types";
import type { Agent } from "@/types/agent.types";

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
  const [marketToAddToAgent, setMarketToAddToAgent] = useState<Market | null>(null);
  const [agentsForPicker, setAgentsForPicker] = useState<Agent[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [enqueueLoading, setEnqueueLoading] = useState(false);

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

  useEffect(() => {
    if (marketToAddToAgent == null) {
      setAgentsForPicker([]);
      return;
    }
    let cancelled = false;
    setPickerLoading(true);
    getMyAgents({ limit: 50 })
      .then((res) => {
        if (!cancelled) setAgentsForPicker(res.data);
      })
      .finally(() => {
        if (!cancelled) setPickerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [marketToAddToAgent]);

  const handleAddToAgent = useCallback((market: Market) => {
    setMarketToAddToAgent(market);
  }, []);

  const handlePickAgentForMarket = useCallback(
    async (agentId: string) => {
      const market = marketToAddToAgent;
      if (market == null) return;
      setEnqueueLoading(true);
      try {
        await enqueueAgentMarket({ marketId: market.id, agentId });
        setMarketToAddToAgent(null);
      } finally {
        setEnqueueLoading(false);
      }
    },
    [marketToAddToAgent]
  );

  const closePicker = useCallback(() => {
    if (!enqueueLoading) setMarketToAddToAgent(null);
  }, [enqueueLoading]);

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
    <>
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
            onAddToAgent={handleAddToAgent}
          />
        ))}
      </div>

      {marketToAddToAgent != null && (
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-to-agent-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closePicker}
        >
          <div
            className="max-h-[80vh] w-full max-w-sm overflow-auto rounded-lg bg-surface p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="add-to-agent-title" className="mb-2 text-sm font-semibold text-foreground">
              Add market to agent
            </h2>
            <p className="mb-3 text-xs text-muted">
              {marketToAddToAgent.name}
            </p>
            {pickerLoading ? (
              <p className="text-sm text-muted">Loading agents…</p>
            ) : agentsForPicker.length === 0 ? (
              <p className="text-sm text-muted">No agents. Create one first.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {agentsForPicker.map((agent) => (
                  <li key={agent.id}>
                    <button
                      type="button"
                      disabled={enqueueLoading}
                      onClick={() => void handlePickAgentForMarket(agent.id)}
                      className="w-full rounded border border-border bg-background px-3 py-2 text-left text-sm font-medium text-foreground transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {agent.name || `Agent ${agent.id.slice(0, 8)}`}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={closePicker}
              disabled={enqueueLoading}
              className="mt-3 w-full rounded border border-border py-2 text-sm text-muted transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </section>
      )}
    </>
  );
}
