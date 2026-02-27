"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchMarkets,
  fetchMarketsSilent,
  fetchMarketsMore,
} from "@/store/slices/marketsSlice";
import { addAgentToMarket, setByMarketFromAgents } from "@/store/slices/marketAgentsSlice";
import { incrementSimulateEnqueuedListVersion } from "@/store/slices/layoutSlice";
import { getMyAgents, enqueueAgentMarket } from "@/lib/api/agents";
import { MiniMarketCard, MiniMarketCardSkeleton } from "@/components/market";
import { toast } from "sonner";
import type { Market } from "@/types/market.types";

export interface SimulateMarketsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

const INITIAL_LIMIT = 30;
const LOAD_MORE_LIMIT = 10;
const SKELETON_COUNT = 6;
const SILENT_REFRESH_INTERVAL_MS = 90_000;

type SimulateFilter = "all" | "added";

export function SimulateMarketsColumn({
  selectedAgentId,
  className = "",
}: SimulateMarketsColumnProps) {
  const dispatch = useAppDispatch();
  const [filter, setFilter] = useState<SimulateFilter>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const list = useAppSelector((state) => state.markets.list);
  const listLoading = useAppSelector((state) => state.markets.listLoading);
  const loadMoreLoading = useAppSelector((state) => state.markets.loadMoreLoading);
  const total = useAppSelector((state) => state.markets.total);
  const byMarket = useAppSelector((state) => state.marketAgents.byMarket);

  const baseParams = useMemo(
    () => ({
      status: "OPEN" as const,
      limit: INITIAL_LIMIT,
      offset: 0,
      ...(dateFrom ? { createdAtFrom: dateFrom } : {}),
      ...(dateTo ? { createdAtTo: dateTo } : {}),
    }),
    [dateFrom, dateTo]
  );

  useEffect(() => {
    if (list.length === 0 && !listLoading) {
      void dispatch(fetchMarkets(baseParams));
    }
  }, [dispatch, list.length, listLoading, baseParams]);

  useEffect(() => {
    if (!dateFrom && !dateTo) return;
    void dispatch(
      fetchMarketsSilent({
        status: "OPEN",
        limit: INITIAL_LIMIT,
        offset: 0,
        createdAtFrom: dateFrom || undefined,
        createdAtTo: dateTo || undefined,
      })
    );
  }, [dateFrom, dateTo, dispatch]);

  useEffect(() => {
    if (list.length === 0) return;
    const id = setInterval(() => {
      void dispatch(fetchMarketsSilent(baseParams));
    }, SILENT_REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [dispatch, list.length, baseParams]);

  const handleAddToAgent = useCallback(
    async (market: Market) => {
      if (selectedAgentId == null) {
        toast.error("Select an agent first");
        return;
      }
      try {
        await enqueueAgentMarket({ marketId: market.id, agentId: selectedAgentId });
        dispatch(addAgentToMarket({ marketId: market.id, agentId: selectedAgentId }));
        const res = await getMyAgents({ limit: 50 });
        dispatch(setByMarketFromAgents({ agents: res.data ?? [] }));
        dispatch(incrementSimulateEnqueuedListVersion());
        toast.success("Market added to agent");
      } catch {
        toast.error("Failed to add market to agent");
      }
    },
    [selectedAgentId, dispatch]
  );

  const handleLoadMore = useCallback(() => {
    const nextOffset = list.length;
    void dispatch(
      fetchMarketsMore({
        ...baseParams,
        limit: LOAD_MORE_LIMIT,
        offset: nextOffset,
      })
    );
  }, [dispatch, list.length, baseParams]);

  const filteredList = useMemo(() => {
    if (filter === "all") return list;
    if (!selectedAgentId) return list;
    return list.filter((m) => (byMarket[m.id] ?? []).includes(selectedAgentId));
  }, [list, filter, selectedAgentId, byMarket]);

  const hasMore = list.length < total;

  const isLoading = listLoading && list.length === 0;

  if (selectedAgentId == null) {
    return (
      <aside className={className} aria-label="Markets list for simulate">
        <p className="text-xs text-muted-foreground">
          Select an agent in the Agent config column to add markets to it.
        </p>
      </aside>
    );
  }

  if (isLoading) {
    return (
      <aside className={className} aria-label="Markets list for simulate">
        <div
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Loading markets"
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <MiniMarketCardSkeleton key={i} />
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className={className} aria-label="Markets list for simulate">
      <div className="mb-2 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="simulate-filter" className="text-xs text-muted-foreground">
            Show:
          </label>
          <select
            id="simulate-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value as SimulateFilter)}
            className="rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
            aria-label="Filter markets"
          >
            <option value="all">All</option>
            <option value="added">Added to agent</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1 text-foreground"
              aria-label="Created from date"
            />
          </label>
          <label className="flex items-center gap-1">
            <span className="text-muted-foreground">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded border border-border bg-background px-2 py-1 text-foreground"
              aria-label="Created to date (agent info cutoff)"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                void dispatch(fetchMarketsSilent({ status: "OPEN", limit: INITIAL_LIMIT, offset: 0 }));
              }}
              className="text-primary underline"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>
      {filteredList.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {filter === "all" ? "No open markets." : "No markets added to agent."}
        </p>
      ) : (
        <>
          <div aria-label="Markets list">
            {filteredList.map((market) => (
              <MiniMarketCard
                key={market.id}
                market={market}
                onAddToAgent={handleAddToAgent}
                addedAgentIds={byMarket[market.id] ?? []}
                showActions={true}
                imageSize="small"
              />
            ))}
          </div>
          {hasMore && filter === "all" && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadMoreLoading}
              className="mt-2 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {loadMoreLoading ? "Loading..." : "Load more (10)"}
            </button>
          )}
        </>
      )}
    </aside>
  );
}
