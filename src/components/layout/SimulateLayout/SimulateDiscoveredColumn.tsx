"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  incrementSimulateBalanceVersion,
  incrementSimulateEnqueuedListVersion,
} from "@/store/slices/layoutSlice";
import { getEnqueuedMarkets, triggerAgentRun } from "@/lib/api/agents";
import { startSimulation } from "@/lib/api/simulate";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import type { EnqueuedMarketItem } from "@/lib/api/agents";

export interface SimulateDiscoveredColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

const DISCOVERED_IMAGE_SIZE = 48;
const PAGE_SIZE = 20;

export function SimulateDiscoveredColumn({
  selectedAgentId,
  className = "",
}: SimulateDiscoveredColumnProps) {
  const [items, setItems] = useState<EnqueuedMarketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [startingSimulation, setStartingSimulation] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const enqueuedListVersion = useAppSelector(
    (state) => state.layout.simulateEnqueuedListVersion
  );

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (!selectedAgentId) return;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const res = await getEnqueuedMarkets(selectedAgentId, {
          limit: PAGE_SIZE,
          offset,
        });
        setTotal(res.total);
        if (append) {
          setItems((prev) => [...prev, ...res.data]);
        } else {
          setItems(res.data);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
        if (!append) setItems([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedAgentId]
  );

  useEffect(() => {
    if (!selectedAgentId) {
      queueMicrotask(() => {
        setItems([]);
        setTotal(0);
      });
      return;
    }
    void fetchPage(0, false);
  }, [selectedAgentId, enqueuedListVersion, fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (!selectedAgentId || loadingMore || items.length >= total) return;
    void fetchPage(items.length, true);
  }, [selectedAgentId, loadingMore, items.length, total, fetchPage]);

  const hasMore = items.length < total;

  const handleTrigger = useCallback(async () => {
    if (!selectedAgentId || triggering) return;
    setTriggering(true);
    try {
      const res = await triggerAgentRun(selectedAgentId, { chainKey: "tenderly" });
      toast.success(`Triggered analysis for ${res.triggered} market(s)`);
      void fetchPage(0, false);
      const delayMs = 4000;
      setTimeout(() => dispatch(incrementSimulateBalanceVersion()), delayMs);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Trigger failed");
    } finally {
      setTriggering(false);
    }
  }, [selectedAgentId, triggering, fetchPage, dispatch]);

  const handleStartSimulation = useCallback(async () => {
    if (!selectedAgentId || startingSimulation) return;
    const start = dateRangeStart.trim();
    const end = dateRangeEnd.trim();
    if (!start || !end) {
      toast.error("Select start and end date for simulation");
      return;
    }
    if (new Date(start) > new Date(end)) {
      toast.error("Start date must be before end date");
      return;
    }
    setStartingSimulation(true);
    setError(null);
    try {
      const res = await startSimulation({
        agentId: selectedAgentId,
        dateRange: { start: `${start}T00:00:00.000Z`, end: `${end}T23:59:59.999Z` },
      });
      toast.success(`Simulation started: ${res.enqueued} market(s) enqueued`);
      dispatch(incrementSimulateEnqueuedListVersion());
      void fetchPage(0, false);
      setTimeout(() => dispatch(incrementSimulateBalanceVersion()), 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Start simulation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setStartingSimulation(false);
    }
  }, [selectedAgentId, startingSimulation, dateRangeStart, dateRangeEnd, fetchPage, dispatch]);

  if (selectedAgentId == null) {
    return (
      <section className={className} aria-label="Discovered markets and analysis">
        <p className="text-xs text-muted-foreground">
          Select an agent to see markets added for analysis.
        </p>
      </section>
    );
  }

  return (
    <section className={className} aria-label="Discovered markets and analysis">
      <section className="mb-4" aria-labelledby="simulate-date-range-heading">
        <h3 id="simulate-date-range-heading" className="mb-2 text-xs font-semibold text-muted-foreground">
          Start simulation (date range)
        </h3>
        <p className="mb-2 text-[10px] text-muted-foreground">
          Discover markets that were active or resolved in this range. The agent will only use information available within the range (as-of simulation).
        </p>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="simulate-date-start">Simulation start date</label>
          <input
            id="simulate-date-start"
            type="date"
            value={dateRangeStart}
            onChange={(e) => setDateRangeStart(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            aria-label="Start date"
          />
          <label className="sr-only" htmlFor="simulate-date-end">Simulation end date</label>
          <input
            id="simulate-date-end"
            type="date"
            value={dateRangeEnd}
            onChange={(e) => setDateRangeEnd(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground"
            aria-label="End date"
          />
          <button
            type="button"
            onClick={handleStartSimulation}
            disabled={startingSimulation || !dateRangeStart || !dateRangeEnd}
            className="shrink-0 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-50"
          >
            {startingSimulation ? "Starting..." : "Start simulation"}
          </button>
        </div>
      </section>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">
          Markets added to this agent. Status: PENDING until agent runs, then DISCARDED (with reason) or TRADED.
        </p>
        <button
          type="button"
          onClick={handleTrigger}
          disabled={triggering || items.length === 0}
          className="shrink-0 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-50"
        >
          {triggering ? "Running..." : "Run analysis"}
        </button>
      </div>
      <p className="mb-2 text-[10px] text-muted-foreground">
        Run analysis queues jobs. The backend agent worker must be running (and AGENT_TRADING_ENABLED) for status to change to DISCARDED (with reason) or TRADED. If nothing updates, check the worker process and Redis.
      </p>
      {error != null && (
        <p className="mb-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No markets added yet. Use &quot;Add to agent&quot; in the Markets column.
        </p>
      ) : (
        <>
          <ul className="space-y-2" role="list">
            {items.map((item) => {
              const isDiscarded = item.status === "DISCARDED";
              return (
                <li
                  key={item.marketId}
                  className="flex items-start gap-3 rounded border border-border bg-surface p-2"
                >
                  <figure className="h-12 w-12 shrink-0 overflow-hidden rounded-sm" aria-hidden>
                    <img
                      src={getDiceBearAvatarUrl(item.marketId, "market")}
                      alt=""
                      width={DISCOVERED_IMAGE_SIZE}
                      height={DISCOVERED_IMAGE_SIZE}
                      className="h-12 w-12 object-cover"
                      loading="lazy"
                    />
                  </figure>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`block truncate text-sm font-medium ${
                        isDiscarded ? "text-muted line-through" : "text-foreground"
                      }`}
                    >
                      {item.marketName || item.marketId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.status}
                    </span>
                    {isDiscarded && item.discardReason != null && item.discardReason !== "" && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.discardReason}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-2 w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </>
      )}
    </section>
  );
}
