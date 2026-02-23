"use client";

import { useEffect, useState } from "react";
import { getAgents } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";
import { AgentTreemap } from "./AgentTreemap";

const AGENTS_LIMIT = 30;
const TREEMAP_TOP = 12;

export interface AgentsColumnProps {
  /** Max agents to fetch. Default 30. */
  limit?: number;
  /** Filter by status. Default ACTIVE. */
  status?: "ACTIVE" | "PAUSED" | "DEPLETED" | "EXPIRED";
  className?: string;
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${Number(pnl).toFixed(2)}`;
}

function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "text-success";
    case "PAUSED":
      return "text-warning";
    case "DEPLETED":
    case "EXPIRED":
    default:
      return "text-muted";
  }
}

function AgentsColumnSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-label="Agents loading">
      <div className="h-[200px] animate-pulse rounded bg-surface" />
      <ul className="space-y-0">
        {Array.from({ length: 5 }, (_, i) => (
          <li key={i} className="animate-pulse border-b border-border bg-surface p-3">
            <div className="mb-1 h-3 w-2/3 rounded bg-muted/50" />
            <div className="h-3 w-1/2 rounded bg-muted/50" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AgentsColumn({
  limit = AGENTS_LIMIT,
  status = "ACTIVE",
  className = "",
}: AgentsColumnProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    getAgents({ limit, status })
      .then((res) => {
        if (!cancelled) {
          setAgents(res.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load agents");
          setAgents([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [limit, status]);

  if (loading && agents.length === 0) {
    return (
      <div className={className}>
        <AgentsColumnSkeleton />
      </div>
    );
  }

  if (error != null) {
    return (
      <p className={`text-sm text-muted-foreground ${className}`.trim()}>
        {error}
      </p>
    );
  }

  const topForTreemap = agents
    .slice()
    .sort((a, b) => (b.tradedAmount ?? 0) - (a.tradedAmount ?? 0))
    .slice(0, TREEMAP_TOP);

  return (
    <article
      className={`flex flex-col gap-3 ${className}`.trim()}
      aria-label="Top agents"
    >
      {topForTreemap.length > 0 && (
        <AgentTreemap agents={topForTreemap} />
      )}
      {agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No agents yet. Create one to see it here.
        </p>
      ) : (
        <ul className="space-y-0" aria-label="Agent list">
          {agents.map((agent) => {
            const pnl = agent.pnl ?? 0;
            const pnlClass = pnl >= 0 ? "text-success" : "text-danger";
            return (
              <li key={agent.id}>
                <section className="border-b border-border bg-surface p-3 transition-colors last:border-b-0 hover:bg-muted/30">
                  <h4 className="text-sm font-semibold text-foreground">
                    {agent.name || agent.id.slice(0, 8)}
                  </h4>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className={statusColor(agent.status)}>{agent.status}</span>
                    {agent.template?.name != null && (
                      <span className="text-muted">{agent.template.name}</span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span><span className="text-foreground font-medium">Bal</span> {Number(agent.balance).toFixed(2)}</span>
                    <span><span className="text-foreground font-medium">Vol</span> {Number(agent.tradedAmount).toFixed(0)}</span>
                    <span><span className="text-foreground font-medium">Trades</span> {agent.totalTrades}</span>
                    <span className={pnlClass}><span className="text-muted font-normal">PnL</span> {formatPnl(pnl)}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-muted">
                    {formatTimeAgo(agent.updatedAt)}
                  </p>
                </section>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
