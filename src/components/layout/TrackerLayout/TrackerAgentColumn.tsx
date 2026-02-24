"use client";

import { useEffect, useState } from "react";
import { getMyAgents } from "@/lib/api/agents";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import type { Agent } from "@/types/agent.types";
import { AgentTreemap } from "@/components/layout/AgentsColumn/AgentTreemap";
import { useAppDispatch } from "@/store/hooks";
import { addRecent } from "@/store/slices/recentSlice";

const AGENTS_LIMIT = 50;

export interface TrackerAgentColumnProps {
  selectedAgentId: string | null;
  onSelectAgent: (agent: Agent | null) => void;
  className?: string;
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${Number(pnl).toFixed(2)}`;
}

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE":
      return "text-success";
    case "PAUSED":
      return "text-warning";
    default:
      return "text-muted";
  }
}

export function TrackerAgentColumn({
  selectedAgentId,
  onSelectAgent,
  className = "",
}: TrackerAgentColumnProps) {
  const dispatch = useAppDispatch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getMyAgents({ limit: AGENTS_LIMIT })
      .then((res) => {
        if (!cancelled) {
          const list = res.data ?? [];
          setAgents(list);
          if (list.length > 0 && selectedAgentId == null) {
            onSelectAgent(list[0] ?? null);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Sign in to see your agents.";
          setError(message);
          setAgents([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [onSelectAgent, selectedAgentId]);

  if (error != null) {
    const isUnauth = error.includes("401") || error.toLowerCase().includes("unauthorized");
    return (
      <aside className={`text-sm text-muted-foreground ${className}`.trim()}>
        {isUnauth ? (
          <p>Sign in to see your agents.</p>
        ) : (
          <p>{error}</p>
        )}
      </aside>
    );
  }

  const selectedAgent =
    selectedAgentId != null
      ? agents.find((a) => a.id === selectedAgentId) ?? null
      : null;

  return (
    <aside
      className={`flex flex-col gap-4 overflow-auto ${className}`.trim()}
      aria-label="Your agents"
    >
      <section aria-label="User Agents TreeMap">
        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
          User Agents TreeMap
        </h3>
        {loading && agents.length === 0 ? (
          <div className="h-[200px] animate-pulse rounded bg-surface" />
        ) : agents.length > 0 ? (
          <AgentTreemap agents={agents} />
        ) : (
          <p className="text-sm text-muted-foreground">No agents yet.</p>
        )}
      </section>

      <section aria-label="Agent list">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Select agent
        </h3>
        {loading && agents.length === 0 ? (
          <ul className="space-y-0">
            {[1, 2, 3].map((i) => (
              <li
                key={i}
                className="animate-pulse border-b border-border bg-surface p-3"
              >
                <div className="h-4 w-2/3 rounded bg-muted/50" />
              </li>
            ))}
          </ul>
        ) : agents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No agents to list.</p>
        ) : (
          <ul className="space-y-0">
            {agents.map((agent) => {
              const isSelected = agent.id === selectedAgentId;
              const pnl = agent.pnl ?? 0;
              const pnlClass = pnl >= 0 ? "text-success" : "text-danger";
              return (
                <li key={agent.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSelected) {
                        dispatch(addRecent({ type: "agent", id: agent.id, label: agent.name }));
                      }
                      onSelectAgent(isSelected ? null : agent);
                    }}
                    className={`flex w-full gap-3 border-b border-border bg-surface p-3 text-left transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                      isSelected
                        ? "bg-primary-muted text-primary"
                        : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear data URI */}
                    <img
                      src={getDiceBearAvatarUrl(agent.id, "agent")}
                      alt=""
                      width={36}
                      height={36}
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">
                        {agent.name || agent.id.slice(0, 8)}
                      </span>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-xs">
                        <span className={statusColor(agent.status)}>
                          {agent.status}
                        </span>
                        <span className="text-muted">Bal {Number(agent.balance).toFixed(2)}</span>
                        <span className={pnlClass}>PnL {formatPnl(pnl)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 rounded-md border border-transparent bg-success px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      aria-label={`Deposit to ${agent.name || "agent"}`}
                    >
                      Deposit
                    </button>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selectedAgent != null && (
        <>
          <section aria-label="Agent settings">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Settings
            </h3>
            <div className="border-b border-border bg-surface p-3 text-sm text-muted-foreground last:border-b-0">
              Agent settings (name, status, keys) – coming soon.
            </div>
          </section>
          <section aria-label="Preferences">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Preferences
            </h3>
            <div className="border-b border-border bg-surface p-3 text-sm text-muted-foreground last:border-b-0">
              Strategy preference, slippage, spread – from AgentStrategy.
            </div>
          </section>
          <section aria-label="Thinking">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Thinking
            </h3>
            <div className="border-b border-border bg-surface p-3 text-sm text-muted-foreground last:border-b-0">
              Agent reasoning / AiLog – coming soon.
            </div>
          </section>
          <section aria-label="AI requests">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              AI requests
            </h3>
            <div className="border-b border-border bg-surface p-3 text-sm text-muted-foreground last:border-b-0">
              Prompts and responses – AiRequest (or AiLog) – coming soon.
            </div>
          </section>
        </>
      )}
    </aside>
  );
}
