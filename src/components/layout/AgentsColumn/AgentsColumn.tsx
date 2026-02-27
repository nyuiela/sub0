"use client";

import { useCallback, useEffect, useState } from "react";
import { getAgentsPublic, getMyAgents } from "@/lib/api/agents";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import type { Agent, AgentPublic } from "@/types/agent.types";
import { AgentTreemap } from "./AgentTreemap";
import { DepositToAgentModal } from "@/components/layout/DepositToAgent/DepositToAgentModal";
import { GetWalletModal } from "@/components/layout/DepositToAgent/GetWalletModal";
import { useAppSelector } from "@/store/hooks";
import { formatCollateral } from "@/lib/formatNumbers";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";

const AGENTS_LIMIT = 30;
const TREEMAP_TOP = 12;
const BALANCE_REFRESH_MS = 5000;

/** Display row: full agent when owned, minimal when from public list only. */
export type AgentRowDisplay = Agent & { isMine: boolean };

function parseNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function publicToRow(ap: AgentPublic): AgentRowDisplay {
  return {
    id: ap.id,
    ownerId: "",
    name: ap.name,
    persona: null,
    publicKey: null,
    walletAddress: null,
    balance: 0,
    tradedAmount: parseNum(ap.volume),
    totalTrades: ap.trades,
    pnl: parseNum(ap.pnl),
    status: ap.status,
    modelSettings: null,
    templateId: null,
    createdAt: ap.createdAt,
    updatedAt: ap.updatedAt,
    owner: "",
    strategy: null,
    template: null,
    isMine: false,
  };
}

export interface AgentsColumnProps {
  /** Max agents to fetch. Default 30. */
  limit?: number;
  /** Filter by status. Default ACTIVE. */
  status?: "ACTIVE" | "PAUSED" | "DEPLETED" | "EXPIRED";
  className?: string;
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${formatCollateral(pnl)}`;
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
      <div className="h-[200px] animate-pulse rounded-lg bg-muted/50" />
      <ul className="space-y-0">
        {Array.from({ length: 5 }, (_, i) => (
          <li
            key={i}
            className="border-b border-border bg-surface p-3 last:border-b-0"
          >
            <div className="mb-1.5 h-3 w-2/3 animate-pulse rounded bg-muted/50" />
            <div className="mb-1.5 h-3 w-1/2 animate-pulse rounded bg-muted/50" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-muted/50" />
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
  const liveBalances = useAppSelector((state) => state.agents.balanceByAgentId);
  const [agents, setAgents] = useState<AgentRowDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentForDeposit, setAgentForDeposit] = useState<Agent | null>(null);
  const [agentForGetWallet, setAgentForGetWallet] = useState<Agent | null>(null);

  const mergeAndSetAgents = useCallback(
    (publicList: AgentPublic[], myList: Agent[]) => {
      const myMap = new Map(myList.map((a) => [a.id, a]));
      const merged: AgentRowDisplay[] = publicList.map((ap) => {
        const mine = myMap.get(ap.id);
        if (mine) return { ...mine, isMine: true };
        return publicToRow(ap);
      });
      merged.sort((a, b) => (b.tradedAmount ?? 0) - (a.tradedAmount ?? 0));
      setAgents(merged);
    },
    []
  );

  const refetchAgents = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      getAgentsPublic({ limit, status }),
      getMyAgents({ limit, status }).catch(() => ({ data: [] as Agent[], total: 0, limit, offset: 0 })),
    ])
      .then(([publicRes, myRes]) => {
        const publicList = publicRes.data ?? [];
        const myList = myRes.data ?? [];
        mergeAndSetAgents(publicList, myList);
      })
      .catch(() => {})
      .finally(() => {
        setRefreshing(false);
      });
  }, [limit, status, mergeAndSetAgents]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });

    Promise.all([
      getAgentsPublic({ limit, status }),
      getMyAgents({ limit, status }).catch(() => ({ data: [] as Agent[], total: 0, limit, offset: 0 })),
    ])
      .then(([publicRes, myRes]) => {
        if (cancelled) return;
        const publicList = publicRes.data ?? [];
        const myList = myRes.data ?? [];
        mergeAndSetAgents(publicList, myList);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load agents.");
          setAgents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [limit, status, mergeAndSetAgents]);

  useEffect(() => {
    if (agents.length === 0) return;
    const interval = setInterval(refetchAgents, BALANCE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [agents.length, refetchAgents]);

  const myAgentIds = agents.filter((a) => a.isMine).map((a) => a.id);
  useMarketSocket({
    agentIds: myAgentIds,
    enabled: myAgentIds.length > 0,
  });

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

  const topForTreemap = agents.slice(0, TREEMAP_TOP);

  return (
    <article
      className={`flex flex-col gap-3 ${className}`.trim()}
      aria-label="Top agents"
    >
      {topForTreemap.length > 0 && (
        <section aria-label="Agents TreeMap">
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Agents by volume
          </h3>
          <p className="mb-2 text-[10px] text-muted-foreground">
            All agents listed. Only yours show Deposit / Get wallet.
          </p>
          <AgentTreemap agents={topForTreemap} />
        </section>
      )}
      {agents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No agents yet. Create one in Settings to see it here.
        </p>
      ) : (
        <ul className="space-y-0" aria-label="Agent list">
          {agents.map((agent) => {
            const pnl = agent.pnl ?? 0;
            const pnlClass = pnl >= 0 ? "text-success" : "text-danger";
            const isMine = agent.isMine;
            const hasWallet = agent.hasCompleteWallet === true;
            return (
              <li key={agent.id}>
                <section className="flex gap-3 border-b border-border bg-surface p-3 transition-colors last:border-b-0 hover:bg-muted/30">
                  {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear data URI */}
                  <img
                    src={getDiceBearAvatarUrl(agent.id, "agent")}
                    alt=""
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
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
                      <span>
                        <span className="text-foreground font-medium">Bal</span>{" "}
                        {isMine
                          ? refreshing
                            ? <span className="inline-block h-3.5 w-10 animate-pulse rounded bg-muted align-middle" aria-hidden />
                            : formatCollateral(liveBalances[agent.id] ?? agent.balance)
                          : "-"}
                      </span>
                      <span><span className="text-foreground font-medium">Vol</span> {formatCollateral(agent.tradedAmount)}</span>
                      <span><span className="text-foreground font-medium">Trades</span> {agent.totalTrades}</span>
                      <span className={pnlClass}><span className="text-muted font-normal">PnL</span> {formatPnl(pnl)}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted">
                      {formatTimeAgo(agent.updatedAt)}
                    </p>
                  </div>
                  {isMine && (
                    <div className="shrink-0 self-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (hasWallet) setAgentForDeposit(agent);
                          else setAgentForGetWallet(agent);
                        }}
                        className="cursor-pointer rounded-md border border-transparent bg-success 
                        px-3 py-1.5 text-xs font-medium text-white transition-opacity 
                        hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 
                        focus-visible:ring-primary focus-visible:ring-offset-2"
                        aria-label={
                          hasWallet
                            ? `Deposit to ${agent.name || "agent"}`
                            : `Get wallet for ${agent.name || "agent"}`
                        }
                      >
                        {hasWallet ? "Deposit" : "Get wallet"}
                      </button>
                    </div>
                  )}
                </section>
              </li>
            );
          })}
        </ul>
      )}

      {agentForDeposit != null && (
        <DepositToAgentModal
          agent={agentForDeposit}
          onClose={() => setAgentForDeposit(null)}
          onTransferSuccess={refetchAgents}
        />
      )}
      {agentForGetWallet != null && (
        <GetWalletModal
          agent={agentForGetWallet}
          onClose={() => setAgentForGetWallet(null)}
          onSuccess={() => {
            setAgentForGetWallet(null);
            refetchAgents();
          }}
        />
      )}
    </article>
  );
}
