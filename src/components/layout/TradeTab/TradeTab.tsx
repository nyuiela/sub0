"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getActivities } from "@/lib/api/activities";
import { getAgentPendingTrades } from "@/lib/api/pendingTrades";
import { getMyAgents } from "@/lib/api/agents";
import type { ActivityItem, ActivityTradePayload } from "@/types/activity.types";
import type { PendingAgentTradeItem } from "@/types/pending-trade.types";
import type { Agent } from "@/types/agent.types";

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
  return (
    <tr className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-2 text-sm text-muted-foreground">Executed</td>
      <td className="py-2 text-right">
        <span className={side === "long" ? "text-green-600" : "text-red-600"}>{side}</span>
      </td>
      <td className="py-2 text-right tabular-nums">{p.amount}</td>
      <td className="py-2 text-right tabular-nums">{p.price}</td>
      <td className="py-2 font-mono text-xs">{who}</td>
      <td className="py-2 text-right text-muted-foreground">{formatTimeAgo(p.createdAt)}</td>
    </tr>
  );
}

function PendingTradeRow({ row }: { row: PendingAgentTradeItem }) {
  const side = row.side === "BID" ? "long" : "short";
  const reason =
    row.pendingReason === "NO_WALLET"
      ? "Pending (no wallet)"
      : "Pending (add funds)";
  const agentName = row.agent?.name ?? row.agentId.slice(0, 8) + "...";
  return (
    <tr className="border-b border-border/50 hover:bg-muted/50 bg-muted/20">
      <td className="py-2 text-sm text-amber-600">{reason}</td>
      <td className="py-2 text-right">
        <span className={side === "long" ? "text-green-600" : "text-red-600"}>{side}</span>
      </td>
      <td className="py-2 text-right tabular-nums">{row.quantity}</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 font-mono text-xs" title={row.agentId}>
        {agentName}
      </td>
      <td className="py-2 text-right text-muted-foreground">{formatTimeAgo(row.createdAt)}</td>
    </tr>
  );
}

export interface TradeTabProps {
  /** When true, tab is visible; refetch when becoming active so new enqueues appear. */
  isActive?: boolean;
}

export function TradeTab({ isActive = true }: TradeTabProps) {
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
    Promise.all([
      getActivities({ types: "trade", limit: 30 }),
      getAgentPendingTrades({ status: "PENDING", limit: 30 }),
      getMyAgents({ limit: 50 }).catch(() => ({ data: [] as Agent[], total: 0, limit: 50, offset: 0 })),
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
  }, [isActive]);

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
      <div className="min-h-[120px] flex-1 overflow-auto">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="p-4 text-sm text-destructive">{error}</p>
        ) : isEmpty ? (
          <p className="p-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">No trades yet.</span> On Markets, use Add to agent and click Apply to enqueue markets for your agents. Use Refresh above or switch tabs to see updates. Pending trades appear here until the agent has a wallet and balance.
          </p>
        ) : (
          <>
            {(hasExecuted || hasPending) && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground sticky top-0 bg-background">
                    <th className="py-2 text-left font-medium">Status</th>
                    <th className="py-2 text-right font-medium">Side</th>
                    <th className="py-2 text-right font-medium">Amount</th>
                    <th className="py-2 text-right font-medium">Price</th>
                    <th className="py-2 text-left font-medium">Agent / User</th>
                    <th className="py-2 text-right font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {executed.map((item) => (
                    <ExecutedTradeRow key={item.id} item={item} />
                  ))}
                  {pending.map((row) => (
                    <PendingTradeRow key={row.id} row={row} />
                  ))}
                </tbody>
              </table>
            )}
            {hasEnqueued && (
              <section className="border-t border-border mt-4 px-4 py-3" aria-label="Markets in queue">
                <h3 className="text-sm font-medium text-foreground mb-2">Markets added to agents</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {agentsWithQueue.map((agent) => (
                    <li key={agent.id}>
                      <span className="font-medium text-foreground">{agent.name}</span>
                      {" – "}
                      {(agent.enqueuedMarketIds ?? []).length} market{(agent.enqueuedMarketIds ?? []).length === 1 ? "" : "s"} in queue
                      {". "}
                      Pending analysis and trade when agent has wallet and funds.
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </section>
  );
}
