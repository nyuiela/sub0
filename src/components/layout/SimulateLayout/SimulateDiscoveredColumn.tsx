"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  incrementSimulateBalanceVersion,
  incrementSimulateEnqueuedListVersion,
  setSelectedSimulateAgentId,
  startSimulationRun,
  stopSimulationRun,
} from "@/store/slices/layoutSlice";
import { getEnqueuedMarkets, deleteAgentEnqueuedMarket } from "@/lib/api/agents";
import { startSimulation, stopSimulation } from "@/lib/api/simulate";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import Countdown, { zeroPad } from "react-countdown";
import type { EnqueuedMarketItem } from "@/lib/api/agents";

const CountdownRenderer = ({ minutes, seconds, completed }: { minutes: number; seconds: number; completed: boolean }) => {
  if (completed) return <span className="font-bold text-danger">SIMULATION ENDED</span>;
  return (
    <div className="flex items-center gap-2 font-mono text-2xl font-bold text-primary">
      <div className="rounded border border-primary/20 bg-surface px-2 py-1">{zeroPad(minutes)}</div>
      <span>:</span>
      <div className="rounded border border-primary/20 bg-surface px-2 py-1">{zeroPad(seconds)}</div>
    </div>
  );
};

export interface SimulateDiscoveredColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

const DISCOVERED_IMAGE_SIZE = 48;
const PAGE_SIZE = 20;
const DEFAULT_MAX_MARKETS = 100;
const DEFAULT_DURATION_MINUTES = 60;
const MAX_MARKETS_CAP = 500;

const STORAGE_KEY_RUNNING = "sub0_simulate_running";
const STORAGE_KEY_PREFS = "sub0_simulate_prefs";

interface StoredRunning {
  agentId: string;
  endsAt: number;
  simulationId?: string;
}

interface StoredPrefs {
  maxMarkets: number;
  durationMinutes: number;
}

function getInitialMaxMarkets(): string {
  if (typeof window === "undefined") return String(DEFAULT_MAX_MARKETS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    const parsed = raw ? (JSON.parse(raw) as StoredPrefs) : null;
    const n = parsed?.maxMarkets;
    if (typeof n === "number" && n >= 1 && n <= MAX_MARKETS_CAP) return String(Math.floor(n));
  } catch {
    // ignore
  }
  return String(DEFAULT_MAX_MARKETS);
}

function getInitialDuration(): string {
  if (typeof window === "undefined") return String(DEFAULT_DURATION_MINUTES);
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    const parsed = raw ? (JSON.parse(raw) as StoredPrefs) : null;
    const n = parsed?.durationMinutes;
    if (typeof n === "number" && n >= 1) return String(Math.floor(n));
  } catch {
    // ignore
  }
  return String(DEFAULT_DURATION_MINUTES);
}

/** Pricing for paid simulation (USDC). Must match backend x402/pricing.ts. */
const SIMULATE_PRICE_BASE_USDC = 0.5;
const SIMULATE_PRICE_PER_MARKET_USDC = 0.02;
const SIMULATE_PRICE_PER_MINUTE_USDC = 0.02;

function computeSimulatePriceUsdc(maxMarkets: number, durationMinutes: number): number {
  return (
    SIMULATE_PRICE_BASE_USDC +
    maxMarkets * SIMULATE_PRICE_PER_MARKET_USDC +
    durationMinutes * SIMULATE_PRICE_PER_MINUTE_USDC
  );
}

export function SimulateDiscoveredColumn({
  selectedAgentId,
  className = "",
}: SimulateDiscoveredColumnProps) {
  const [items, setItems] = useState<EnqueuedMarketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [startingSimulation, setStartingSimulation] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  const [maxMarketsInput, setMaxMarketsInput] = useState(getInitialMaxMarkets);
  const [durationInput, setDurationInput] = useState(getInitialDuration);
  const [error, setError] = useState<string | null>(null);
  const [removingMarketId, setRemovingMarketId] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_RUNNING);
      const stored = raw ? (JSON.parse(raw) as StoredRunning) : null;
      if (stored?.agentId && typeof stored.endsAt === "number" && stored.endsAt > Date.now()) {
        dispatch(setSelectedSimulateAgentId(stored.agentId));
        dispatch(
          startSimulationRun({
            agentId: stored.agentId,
            durationMs: stored.endsAt - Date.now(),
            simulationId: stored.simulationId ?? undefined,
          })
        );
      } else if (stored) {
        localStorage.removeItem(STORAGE_KEY_RUNNING);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY_RUNNING);
    }
  }, [dispatch]);
  const enqueuedListVersion = useAppSelector(
    (state) => state.layout.simulateEnqueuedListVersion
  );
  const simulationRunningAgentId = useAppSelector(
    (state) => state.layout.simulationRunningAgentId
  );
  const simulationEndsAt = useAppSelector(
    (state) => state.layout.simulationEndsAt
  );
  const simulationId = useAppSelector((state) => state.layout.simulationId);
  const simulationRunning = selectedAgentId != null && simulationRunningAgentId === selectedAgentId;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!simulationRunning || simulationEndsAt == null) return;
    const interval = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [simulationRunning, simulationEndsAt]);
  const secondsLeft =
    simulationRunning && simulationEndsAt != null
      ? Math.max(0, Math.ceil((simulationEndsAt - Date.now()) / 1000))
      : 0;
  const maxMarketsParsed = Math.min(
    MAX_MARKETS_CAP,
    Math.max(1, parseInt(maxMarketsInput, 10) || 0)
  ) || 1;
  const durationParsed = Math.max(1, parseInt(durationInput, 10) || 0) || 1;
  const estimatedPriceUsdc = computeSimulatePriceUsdc(maxMarketsParsed, durationParsed);

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
          chainKey: "tenderly",
          simulationId: simulationId ?? undefined,
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
    [selectedAgentId, simulationId]
  );

  const handleStartSuccess = useCallback(
    (
      enqueued: number,
      cappedDuration: number,
      simulationId?: string,
      cappedMarkets?: number
    ) => {
      toast.success(`Simulation started: ${enqueued} market(s) enqueued`);
      if (selectedAgentId) {
        const durationMs = cappedDuration * 60 * 1000;
        const endsAt = Date.now() + durationMs;
        try {
          localStorage.setItem(
            STORAGE_KEY_RUNNING,
            JSON.stringify({
              agentId: selectedAgentId,
              endsAt,
              simulationId,
            } satisfies StoredRunning)
          );
          if (typeof cappedMarkets === "number" && cappedMarkets >= 1) {
            localStorage.setItem(
              STORAGE_KEY_PREFS,
              JSON.stringify({
                maxMarkets: cappedMarkets,
                durationMinutes: cappedDuration,
              } satisfies StoredPrefs)
            );
          }
        } catch {
          // ignore storage errors
        }
        dispatch(incrementSimulateEnqueuedListVersion());
        dispatch(
          startSimulationRun({
            agentId: selectedAgentId,
            durationMs,
            simulationId,
          })
        );
      }
      void fetchPage(0, false);
      setTimeout(() => dispatch(incrementSimulateBalanceVersion()), 4000);
    },
    [selectedAgentId, fetchPage, dispatch]
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

  useEffect(() => {
    if (!simulationRunning || !selectedAgentId) return;
    const interval = setInterval(() => {
      void fetchPage(0, false);
    }, 15000);
    return () => clearInterval(interval);
  }, [simulationRunning, selectedAgentId, fetchPage]);

  const handleLoadMore = useCallback(() => {
    if (!selectedAgentId || loadingMore || items.length >= total) return;
    void fetchPage(items.length, true);
  }, [selectedAgentId, loadingMore, items.length, total, fetchPage]);

  const handleRemoveFromAgent = useCallback(
    async (marketId: string) => {
      if (!selectedAgentId || !simulationId) {
        toast.error("Simulation context required to remove market");
        return;
      }
      setRemovingMarketId(marketId);
      try {
        await deleteAgentEnqueuedMarket({
          marketId,
          agentId: selectedAgentId,
          simulationId,
        });
        dispatch(incrementSimulateEnqueuedListVersion());
        setItems((prev) => prev.filter((item) => item.marketId !== marketId));
        setTotal((t) => Math.max(0, t - 1));
        toast.success("Market removed from agent queue");
      } catch {
        toast.error("Failed to remove market from agent");
      } finally {
        setRemovingMarketId(null);
      }
    },
    [selectedAgentId, simulationId, dispatch]
  );

  const hasMore = items.length < total;

  const handleStopSimulation = useCallback(() => {
    const id = simulationId;
    if (id?.trim()) {
      stopSimulation(id, { cancelled: true }).catch(() => {
        // non-blocking; Settings may still show RUNNING until next refresh
      });
    }
    try {
      localStorage.removeItem(STORAGE_KEY_RUNNING);
    } catch {
      // ignore
    }
    dispatch(stopSimulationRun());
    toast.info("Simulation stopped");
  }, [dispatch, simulationId]);

  useEffect(() => {
    if (simulationEndsAt == null) return;
    const tick = () => {
      if (Date.now() >= simulationEndsAt) {
        const id = simulationId;
        if (id?.trim()) {
          stopSimulation(id, { cancelled: false }).catch(() => { });
        }
        try {
          localStorage.removeItem(STORAGE_KEY_RUNNING);
        } catch {
          // ignore
        }
        dispatch(stopSimulationRun());
        toast.success("Simulation ended");
        return;
      }
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [simulationEndsAt, dispatch, simulationId]);

  const handleStartSimulation = useCallback(() => {
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
    const cappedMarkets = maxMarketsParsed;
    const cappedDuration = durationParsed;
    setError(null);
    setStartingSimulation(true);
    startSimulation({
      agentId: selectedAgentId,
      dateRange: { start: `${start}T00:00:00.000Z`, end: `${end}T23:59:59.999Z` },
      maxMarkets: cappedMarkets,
      durationMinutes: cappedDuration,
    })
      .then((res) =>
        handleStartSuccess(
          res.enqueued,
          cappedDuration,
          res.simulationId,
          cappedMarkets
        )
      )
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Start simulation failed";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setStartingSimulation(false));
  }, [
    selectedAgentId,
    startingSimulation,
    dateRangeStart,
    dateRangeEnd,
    maxMarketsParsed,
    durationParsed,
    handleStartSuccess,
  ]);


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
        <p className="mb-3 text-[10px] text-muted-foreground">
          Discover markets that were active or resolved in this range. The agent will only use information available within the range (as-of simulation). Start runs discovery and analysis automatically. Fund the agent wallet on the payment chain if you see balance errors.
        </p>
        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="simulate-date-start" className="text-[10px] font-bold uppercase text-muted-foreground">
              From
            </label>
            <input
              id="simulate-date-start"
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              disabled={simulationRunning}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-1 disabled:opacity-60"
              aria-label="Start date"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="simulate-date-end" className="text-[10px] font-bold uppercase text-muted-foreground">
              To
            </label>
            <input
              id="simulate-date-end"
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              disabled={simulationRunning}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none ring-primary focus:ring-1 disabled:opacity-60"
              aria-label="End date"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="simulate-max-markets" className="text-xs font-medium text-foreground">
              Markets
            </label>
            <input
              id="simulate-max-markets"
              type="text"
              inputMode="numeric"
              value={maxMarketsInput}
              onChange={(e) => setMaxMarketsInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
              disabled={simulationRunning}
              className="simulate-number-input w-24 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
              aria-label="Max markets"
              placeholder="100"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="simulate-duration" className="text-xs font-medium text-foreground">
              Time (min)
            </label>
            <input
              id="simulate-duration"
              type="text"
              inputMode="numeric"
              value={durationInput}
              onChange={(e) => setDurationInput(e.target.value.replace(/\D/g, "").slice(0, 5))}
              disabled={simulationRunning}
              className="simulate-number-input w-24 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
              aria-label="Duration minutes"
              placeholder="60"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Min Est. {estimatedPriceUsdc.toFixed(2)} USDC
          </span>
        </div>

        {simulationRunning && simulationEndsAt != null && (
          <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-4">
            <div className="mb-2 flex items-end justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining Time</span>
              <Countdown
                date={simulationEndsAt}
                renderer={CountdownRenderer}
                onComplete={handleStopSimulation}
              />
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{
                  width: `${Math.min(100, (secondsLeft / (durationParsed * 60)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="mt-3">
          {simulationRunning ? (
            <button
              type="button"
              onClick={handleStopSimulation}
              className="rounded bg-danger px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Stop simulation
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartSimulation}
              disabled={startingSimulation || !dateRangeStart || !dateRangeEnd}
              className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:bg-primary/90 disabled:opacity-50"
            >
              {startingSimulation ? "Starting..." : "Start simulation"}
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap justify-between items-center gap-2">
        <p className="mb-2 text-xs text-muted-foreground">
          Markets added to this agent. Status: PENDING until agent runs, then DISCARDED (with reason) or TRADED. List refreshes every 15s while simulation runs.
        </p>
        {items.length > 0 && (
          <div className="flex flex-wrap justify-between items-center gap-2">
            <button
              type="button"
              onClick={() => void fetchPage(0, false)}
              disabled={loading}
              className="mb-2 rounded border border-border bg-surface px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
            >
              Refresh list
            </button>
            <button
              type="button"
              onClick={() => setItems([])}
              disabled={loading}
              className="mb-2 rounded border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 bg-danger text-white cursor-pointer"
            >
              clear list
            </button>
          </div>
        )}
      </div>

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
            {items.map((item: EnqueuedMarketItem) => {
              const isDiscarded = item.status === "DISCARDED";
              const decision = item.tradeReason ?? item.discardReason ?? null;
              return (
                <li
                  key={item.marketId}
                  className={`flex items-start gap-3 rounded border p-2 transition-colors border-border bg-surface ${
                    isDiscarded ? "opacity-75" : ""
                  }`}
                >
                  <figure className="h-12 w-12 shrink-0 overflow-hidden rounded-sm" aria-hidden>
                    <Image
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
                      className={`block truncate text-sm font-medium ${isDiscarded ? "text-muted line-through" : "text-foreground"
                        }`}
                    >
                      {item.marketName || item.marketId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.status === "PENDING"
                        ? "PENDING (waiting for agent)"
                        : item.status}
                    </span>
                    {decision != null && decision !== "" && (
                      <p className="mt-1.5 text-xs text-foreground/90 font-medium">
                        <span className="text-muted-foreground">Agent decision:</span>{" "}
                        {decision}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemoveFromAgent(item.marketId)}
                    disabled={removingMarketId === item.marketId}
                    className="shrink-0 rounded border border-danger/50 bg-danger/10 px-2 py-1 text-xs font-medium text-danger transition-opacity hover:bg-danger/20 disabled:opacity-50"
                    aria-label={`Remove ${item.marketName || item.marketId} from agent`}
                  >
                    {removingMarketId === item.marketId ? "Removing..." : "Remove"}
                  </button>
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
