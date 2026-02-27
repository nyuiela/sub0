"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMarkets } from "@/store/slices/marketsSlice";
import {
  addAgentToMarket,
  removeAgentFromMarket,
  setAgentsForMarket,
  setByMarketFromAgents,
} from "@/store/slices/marketAgentsSlice";
import { getMyAgents, enqueueAgentMarket, deleteAgentEnqueuedMarket } from "@/lib/api/agents";
import { MiniMarketCard } from "../MiniMarketCard";
import { MiniMarketCardSkeleton } from "../MiniMarketCard";
import { MOCK_MARKET } from "@/lib/mockMarket";
import type { Market } from "@/types/market.types";
import type { Agent } from "@/types/agent.types";
import { toast } from "sonner";

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
  const byMarket = useAppSelector((state) => state.marketAgents.byMarket);
  const [marketToAddToAgent, setMarketToAddToAgent] = useState<Market | null>(null);
  const [agentsForPicker, setAgentsForPicker] = useState<Agent[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [enqueueLoading, setEnqueueLoading] = useState(false);
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const hasTriggeredInitialFetch = useRef(false);

  // useEffect(() => {
  //   if (list.length > 0) return;
  //   if (hasTriggeredInitialFetch.current) return;
  //   hasTriggeredInitialFetch.current = true;
  //   void dispatch(fetchMarkets({ status: "OPEN", limit: 24 }));
  // }, [dispatch, list.length]);

  useEffect(() => {
    if (list.length === 0) return;
    let cancelled = false;
    getMyAgents({ limit: 100 })
      .then((res) => {
        if (!cancelled && res.data.length > 0) {
          dispatch(setByMarketFromAgents({ agents: res.data }));
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [dispatch, list.length]);

  useEffect(() => {
    if (marketToAddToAgent == null) {
      queueMicrotask(() => {
        setAgentsForPicker([]);
        setSelectedAgentIds(new Set());
      });
      return;
    }
    const current = byMarket[marketToAddToAgent.id] ?? [];
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setSelectedAgentIds(new Set(current));
        setPickerLoading(true);
      }
    });
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
  }, [marketToAddToAgent, byMarket]);

  const handleAddToAgent = useCallback((market: Market) => {
    setMarketToAddToAgent(market);
  }, []);

  const toggleAgentSelection = useCallback((agentId: string) => {
    setSelectedAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  }, []);

  const handleApplyAgentsForMarket = useCallback(async () => {
    const market = marketToAddToAgent;
    if (market == null) return;
    const current = byMarket[market.id] ?? [];
    const selected = Array.from(selectedAgentIds);
    const toAdd = selected.filter((id) => !current.includes(id));
    const toRemove = current.filter((id) => !selectedAgentIds.has(id));

    setEnqueueLoading(true);
    try {
      for (const agentId of toAdd) {
        await enqueueAgentMarket({ marketId: market.id, agentId });
        dispatch(addAgentToMarket({ marketId: market.id, agentId }));
      }
      for (const agentId of toRemove) {
        await deleteAgentEnqueuedMarket({ marketId: market.id, agentId });
        dispatch(removeAgentFromMarket({ marketId: market.id, agentId }));
      }
      dispatch(setAgentsForMarket({ marketId: market.id, agentIds: selected }));
      setMarketToAddToAgent(null);
      if (toAdd.length > 0) {
        toast.success(
          toAdd.length === 1
            ? "Market added to agent"
            : `Market added to ${toAdd.length} agents`
        );
      }
    } catch {
      toast.error("Failed to update agents for this market");
    } finally {
      setEnqueueLoading(false);
    }
  }, [
    marketToAddToAgent,
    byMarket,
    selectedAgentIds,
    dispatch,
  ]);

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
      <div className={`${className}`} aria-label="Markets list">
        <MiniMarketCard
          market={MOCK_MARKET}
          addedAgentIds={[]}
          showActions={false}
        />
      </div>
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
            addedAgentIds={byMarket[market.id] ?? []}
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
            <p className="mb-2 text-xs text-muted">
              Select or unselect agents. Multiple agents can trade this market.
            </p>
            {pickerLoading ? (
              <p className="text-sm text-muted">Loading agents…</p>
            ) : agentsForPicker.length === 0 ? (
              <p className="text-sm text-muted">No agents. Create one first.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {agentsForPicker.map((agent) => {
                  const isSelected = selectedAgentIds.has(agent.id);
                  return (
                    <li key={agent.id}>
                      <label className="flex cursor-pointer items-center gap-2 rounded border border-border bg-background px-3 py-2 transition-colors hover:bg-muted/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAgentSelection(agent.id)}
                          disabled={enqueueLoading}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          aria-label={`${isSelected ? "Remove" : "Add"} ${agent.name ?? agent.id} from market`}
                        />
                        <span className="text-sm font-medium text-foreground">
                          {agent.name || `Agent ${agent.id.slice(0, 8)}`}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => void handleApplyAgentsForMarket()}
                disabled={enqueueLoading || (pickerLoading && agentsForPicker.length === 0)}
                className="flex-1 rounded-md border border-transparent bg-success px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {enqueueLoading ? "Saving…" : "Apply"}
              </button>
              <button
                type="button"
                onClick={closePicker}
                disabled={enqueueLoading}
                className="rounded-md border border-border px-3 py-2 text-sm text-muted transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
