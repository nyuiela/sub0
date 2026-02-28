"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  incrementSimulateBalanceVersion,
  incrementSimulateEnqueuedListVersion,
  startSimulationRun,
  stopSimulationRun,
} from "@/store/slices/layoutSlice";
import { getEnqueuedMarkets } from "@/lib/api/agents";
import {
  startSimulation,
  getSimulatePaymentConfig,
  type SimulatePaymentConfigResponse,
} from "@/lib/api/simulate";
import {
  getPaymentFetch,
  ensurePaymentChain,
  getPaymentChainName,
} from "@/lib/x402/paymentFetch";
import {
  isSimulatePaymentSuccess,
  isSimulatePaymentError,
} from "@/lib/x402/simulatePayMessages";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import { toast } from "sonner";
import type { EnqueuedMarketItem } from "@/lib/api/agents";

export interface SimulateDiscoveredColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

const DISCOVERED_IMAGE_SIZE = 48;
const PAGE_SIZE = 20;
const DEFAULT_MAX_MARKETS = 100;
const DEFAULT_DURATION_MINUTES = 60;
const MAX_MARKETS_CAP = 500;

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
  const [maxMarketsInput, setMaxMarketsInput] = useState(String(DEFAULT_MAX_MARKETS));
  const [durationInput, setDurationInput] = useState(String(DEFAULT_DURATION_MINUTES));
  const [error, setError] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<SimulatePaymentConfigResponse | null>(null);
  const paymentPopupRef = useRef<Window | null>(null);
  const dispatch = useAppDispatch();
  const enqueuedListVersion = useAppSelector(
    (state) => state.layout.simulateEnqueuedListVersion
  );
  const simulationRunningAgentId = useAppSelector(
    (state) => state.layout.simulationRunningAgentId
  );
  const simulationEndsAt = useAppSelector(
    (state) => state.layout.simulationEndsAt
  );
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

  useEffect(() => {
    if (!selectedAgentId) return;
    getSimulatePaymentConfig()
      .then(setPaymentConfig)
      .catch(() => setPaymentConfig({ paymentRequired: false, paymentChainId: 84532 }));
  }, [selectedAgentId]);

  const handleLoadMore = useCallback(() => {
    if (!selectedAgentId || loadingMore || items.length >= total) return;
    void fetchPage(items.length, true);
  }, [selectedAgentId, loadingMore, items.length, total, fetchPage]);

  const hasMore = items.length < total;

  const handleStopSimulation = useCallback(() => {
    dispatch(stopSimulationRun());
    toast.info("Simulation stopped");
  }, [dispatch]);

  useEffect(() => {
    if (simulationEndsAt == null) return;
    const tick = () => {
      if (Date.now() >= simulationEndsAt) {
        dispatch(stopSimulationRun());
        toast.success("Simulation ended");
        return;
      }
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [simulationEndsAt, dispatch]);

  const handlePaymentSuccess = useCallback(
    (enqueued: number, cappedDuration: number) => {
      toast.success(`Simulation started: ${enqueued} market(s) enqueued`);
      if (selectedAgentId) {
        dispatch(incrementSimulateEnqueuedListVersion());
        dispatch(
          startSimulationRun({
            agentId: selectedAgentId,
            durationMs: cappedDuration * 60 * 1000,
          })
        );
      }
      void fetchPage(0, false);
      setTimeout(() => dispatch(incrementSimulateBalanceVersion()), 4000);
    },
    [selectedAgentId, fetchPage, dispatch]
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || typeof event.data !== "object") return;
      const data = event.data as unknown;
      if (isSimulatePaymentSuccess(data)) {
        paymentPopupRef.current?.close();
        paymentPopupRef.current = null;
        setStartingSimulation(false);
        handlePaymentSuccess(data.enqueued, data.durationMinutes);
      } else if (isSimulatePaymentError(data)) {
        paymentPopupRef.current?.close();
        paymentPopupRef.current = null;
        setStartingSimulation(false);
        setError(data.error);
        toast.error(data.error);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [handlePaymentSuccess]);

  useEffect(() => {
    if (!startingSimulation || !paymentConfig?.paymentRequired) return;
    const popup = paymentPopupRef.current;
    if (!popup) return;
    const interval = setInterval(() => {
      if (popup.closed) {
        clearInterval(interval);
        setStartingSimulation(false);
        paymentPopupRef.current = null;
      }
    }, 500);
    return () => clearInterval(interval);
  }, [startingSimulation, paymentConfig?.paymentRequired]);

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

    if (paymentConfig?.paymentRequired) {
      const chainId = paymentConfig.paymentChainId ?? 84532;
      const payUrl = new URL("/simulate/pay", window.location.origin);
      payUrl.searchParams.set("agentId", selectedAgentId);
      payUrl.searchParams.set("start", start);
      payUrl.searchParams.set("end", end);
      payUrl.searchParams.set("maxMarkets", String(cappedMarkets));
      payUrl.searchParams.set("durationMinutes", String(cappedDuration));
      payUrl.searchParams.set("paymentChainId", String(chainId));
      const popup = window.open(
        payUrl.toString(),
        "simulate-pay",
        "width=480,height=520,scrollbars=yes"
      );
      paymentPopupRef.current = popup ?? null;
      setStartingSimulation(true);
      if (!popup) {
        toast.error("Popup blocked", {
          description: "Open payment in a new tab to complete.",
          action: {
            label: "Open payment",
            onClick: () => {
              const w = window.open(payUrl.toString(), "_blank");
              paymentPopupRef.current = w ?? null;
            },
          },
        });
      }
      return;
    }

    setStartingSimulation(true);
    const fetchOption = undefined;
    startSimulation(
      {
        agentId: selectedAgentId,
        dateRange: { start: `${start}T00:00:00.000Z`, end: `${end}T23:59:59.999Z` },
        maxMarkets: cappedMarkets,
        durationMinutes: cappedDuration,
      },
      fetchOption
    )
      .then((res) => handlePaymentSuccess(res.enqueued, cappedDuration))
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
    paymentConfig?.paymentRequired,
    paymentConfig?.paymentChainId,
    handlePaymentSuccess,
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
          Discover markets that were active or resolved in this range. The agent will only use information available within the range (as-of simulation). Payment is required; after payment, discovery and analysis run automatically.
        </p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="simulate-date-start" className="text-xs font-medium text-foreground">
              Start date
            </label>
            <input
              id="simulate-date-start"
              type="date"
              value={dateRangeStart}
              onChange={(e) => setDateRangeStart(e.target.value)}
              disabled={simulationRunning}
              className="simulate-date-input w-full max-w-48 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
              aria-label="Start date"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="simulate-date-end" className="text-xs font-medium text-foreground">
              End date
            </label>
            <input
              id="simulate-date-end"
              type="date"
              value={dateRangeEnd}
              onChange={(e) => setDateRangeEnd(e.target.value)}
              disabled={simulationRunning}
              className="simulate-date-input w-full max-w-48 rounded border border-border bg-surface px-2 py-1.5 text-sm text-foreground disabled:opacity-60"
              aria-label="End date"
            />
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
          <div>
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
        </div>
        {simulationRunning && simulationEndsAt != null && (
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            Time left: {secondsLeft}s
          </p>
        )}
      </section>
      <p className="mb-2 text-xs text-muted-foreground">
        Markets added to this agent. Status: PENDING until agent runs, then DISCARDED (with reason) or TRADED.
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
