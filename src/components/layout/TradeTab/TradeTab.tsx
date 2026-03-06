"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getActivities } from "@/lib/api/activities";
import { getAgentPendingTrades } from "@/lib/api/pendingTrades";
import { getMyAgents } from "@/lib/api/agents";
import type { ActivityItem, ActivityTradePayload } from "@/types/activity.types";
import type { PendingAgentTradeItem } from "@/types/pending-trade.types";
import type { Agent } from "@/types/agent.types";

function TradeTabSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4" aria-label="Trade loading">
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted/50" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-muted/50" />
        <div className="h-3 w-4/5 animate-pulse rounded bg-muted/50" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted/50" />
      </div>
      <div className="h-32 w-full animate-pulse rounded bg-muted/30" />
      <div className="h-24 w-full animate-pulse rounded bg-muted/30" />
    </div>
  );
}

function MarketsAddedToAgentsCollapsible({ agents }: { agents: Agent[] }) {
  const [sectionOpen, setSectionOpen] = useState(false);
  const [openAgentIds, setOpenAgentIds] = useState<Set<string>>(new Set());

  const toggleAgent = (agentId: string) => {
    setOpenAgentIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  return (
    <section className="border-t border-border py-4" aria-label="Markets in queue">
      <button
        type="button"
        onClick={() => setSectionOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 rounded border border-border bg-muted/30 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={sectionOpen}
      >
        <span>Markets added to agents</span>
        <span className="shrink-0 text-muted-foreground" aria-hidden>
          {sectionOpen ? "\u25B2" : "\u25BC"}
        </span>
      </button>
      {sectionOpen && (
        <p className="mt-2 mb-3 text-xs text-muted-foreground">
          Queued markets below. Pending analysis and trade when agent has wallet and funds.
        </p>
      )}
      {sectionOpen &&
        agents.map((agent) => {
          const ids = agent.enqueuedMarketIds ?? [];
          const isAgentOpen = openAgentIds.has(agent.id);
          return (
            <div key={agent.id} className="mb-3">
              <button
                type="button"
                onClick={() => toggleAgent(agent.id)}
                className="flex w-full items-center justify-between gap-2 rounded border border-border bg-surface px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-expanded={isAgentOpen}
              >
                <span>
                  {agent.name ?? agent.id.slice(0, 8)} – {ids.length} market
                  {ids.length === 1 ? "" : "s"} in queue
                </span>
                <span className="shrink-0 text-muted-foreground" aria-hidden>
                  {isAgentOpen ? "\u25B2" : "\u25BC"}
                </span>
              </button>
              {isAgentOpen && ids.length > 0 && (
                <div className="mt-1 overflow-x-auto rounded border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                        <th className="px-3 py-2 font-medium">#</th>
                        <th className="px-3 py-2 font-medium">Market</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ids.map((marketId, idx) => (
                        <tr
                          key={marketId}
                          className="border-b border-border/50 last:border-b-0 hover:bg-muted/20"
                        >
                          <td className="px-3 py-2 tabular-nums text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/market/${marketId}`}
                              className="font-medium text-primary hover:underline"
                            >
                              View market
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
    </section>
  );
}

function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function ExecutedTradeRow({ item }: { item: ActivityItem }) {
  const p = item.payload as ActivityTradePayload;
  const side = p.side === "BID" ? "long" : "short";
  const who =
    p.userId != null ? p.userId.slice(0, 8) + "..." : p.agentId != null ? p.agentId.slice(0, 8) + "..." : "-";
  const marketId = p.marketId ?? "";
  return (
    <tr className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-2 text-sm text-muted-foreground">Executed</td>
      <td className="py-2 text-right">
        <span className={side === "long" ? "text-green-600" : "text-red-600"}>{side}</span>
      </td>
      <td className="py-2 text-right tabular-nums">{p.amount}</td>
      <td className="py-2 text-right tabular-nums">{p.price}</td>
      <td className="py-2 font-mono text-xs">{who}</td>
      <td className="py-2 text-right text-muted-foreground pr-2">{formatTimeAgo(p.createdAt)}</td>
      <td className="py-2 pl-3">
        {marketId ? (
          <Link
            href={`/market/${marketId}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            View market
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
    </tr>
  );
}

function PendingTradeRow({ row }: { row: PendingAgentTradeItem }) {
  const side = row.side === "BID" ? "long" : "short";
  const reason =
    row.pendingReason === "NO_WALLET"
      ? "Pending (no wallet)"
      : row.pendingReason === "INSUFFICIENT_POSITION"
        ? "Pending (insufficient position)"
        : "Pending (add funds)";
  const agentName = row.agent?.name ?? row.agentId.slice(0, 8) + "...";
  const marketId = row.marketId ?? "";
  return (
    <tr className="border-b border-border/50 bg-muted/20 hover:bg-muted/30">
      <td className="py-2 text-sm text-amber-600">{reason}</td>
      <td className="py-2 text-right">
        <span className={side === "long" ? "text-green-600" : "text-red-600"}>{side}</span>
      </td>
      <td className="py-2 text-right tabular-nums">{row.quantity}</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 font-mono text-xs" title={row.agentId}>
        {agentName}
      </td>
      <td className="py-2 text-right text-muted-foreground pr-2">{formatTimeAgo(row.createdAt)}</td>
      <td className="py-2 pl-3">
        {marketId ? (
          <Link
            href={`/market/${marketId}`}
            className="text-xs font-medium text-primary hover:underline"
          >
            View market
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </td>
    </tr>
  );
}

export interface TradeTabProps {
  /** When true, tab is visible; refetch when becoming active so new enqueues appear. */
  isActive?: boolean;
}

export function TradeTab({ isActive = true }: TradeTabProps) {
  const { user } = useAuth();
  const [executed, setExecuted] = useState<ActivityItem[]>([]);
  const [pending, setPending] = useState<PendingAgentTradeItem[]>([]);
  const [agentsWithQueue, setAgentsWithQueue] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const fetchData = useCallback(() => {
    if (!isActive) return;
    cancelledRef.current = false;
    setLoading(true);
    setError(null);
    const agentsPromise = user != null
      ? getMyAgents({ limit: 50 }).catch(() => ({ data: [] as Agent[], total: 0, limit: 50, offset: 0 }))
      : Promise.resolve({ data: [] as Agent[], total: 0, limit: 50, offset: 0 });
    Promise.all([
      getActivities({ types: "trade", limit: 30 }),
      getAgentPendingTrades({ status: "PENDING", limit: 30 }),
      agentsPromise,
    ])
      .then(([activitiesRes, pendingRes, agentsRes]) => {
        if (cancelledRef.current) return;
        const tradeItems = (activitiesRes.data ?? []).filter((i) => i.payload?.type === "trade");
        setExecuted(tradeItems);
        setPending(pendingRes.data ?? []);
        const withQueue = (agentsRes.data ?? []).filter(
          (a) => Array.isArray(a.enqueuedMarketIds) && a.enqueuedMarketIds.length > 0
        );
        setAgentsWithQueue(withQueue);
      })
      .catch((err) => {
        if (!cancelledRef.current) setError(err instanceof Error ? err.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelledRef.current) setLoading(false);
      });
  }, [isActive, user]);

  useEffect(() => {
    fetchData();
    return () => {
      cancelledRef.current = true;
    };
  }, [fetchData]);

  const hasExecuted = executed.length > 0;
  const hasPending = pending.length > 0;
  const hasEnqueued = agentsWithQueue.length > 0;
  const isEmpty = !hasExecuted && !hasPending && !hasEnqueued;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Trade activity">
      <header className="shrink-0 border-b border-border bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Recent and pending trades</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Executed trades, pending agent trades (wallet/funds), and markets added to agents.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchData()}
            disabled={loading}
            className="shrink-0 rounded border border-border bg-background px-2 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </header>
      <div className="min-h-[120px] flex-1 overflow-auto px-4">
        {loading ? (
          <TradeTabSkeleton />
        ) : error ? (
          <p className="p-4 text-sm text-destructive">{error}</p>
        ) : isEmpty ? (
          <p className="p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">No trades yet.</span> On Markets, use Add to agent and click Apply to enqueue markets for your agents. Use Refresh above or switch tabs to see updates. Pending trades appear here until the agent has a wallet and balance.
          </p>
        ) : (
          <>
            {hasExecuted && (
              <section className="py-4" aria-label="Executed trades">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Executed trades
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground sticky top-0 bg-background">
                      <th className="py-2 text-left font-medium">Status</th>
                      <th className="py-2 text-right font-medium">Side</th>
                      <th className="py-2 text-right font-medium">Amount</th>
                      <th className="py-2 text-right font-medium">Price</th>
                      <th className="py-2 text-left font-medium">Agent / User</th>
                      <th className="py-2 text-right font-medium pr-2">Time</th>
                      <th className="py-2 text-left font-medium pl-3">Market</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executed.map((item) => (
                      <ExecutedTradeRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            {hasPending && (
              <section className="border-t border-border py-4" aria-label="Pending trades">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Pending trades (your agents)
                </h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground sticky top-0 bg-background">
                      <th className="py-2 text-left font-medium">Status</th>
                      <th className="py-2 text-right font-medium">Side</th>
                      <th className="py-2 text-right font-medium">Amount</th>
                      <th className="py-2 text-right font-medium">Price</th>
                      <th className="py-2 text-left font-medium">Agent</th>
                      <th className="py-2 text-right font-medium pr-2">Time</th>
                      <th className="py-2 text-left font-medium pl-3">Market</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((row) => (
                      <PendingTradeRow key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            {hasEnqueued && (
              <MarketsAddedToAgentsCollapsible agents={agentsWithQueue} />
            )}
          </>
        )}
      </div>
    </section>
  );
}
