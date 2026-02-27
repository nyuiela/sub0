"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyAgents, syncAgentBalance } from "@/lib/api/agents";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import type { Agent } from "@/types/agent.types";
import { AgentTreemap } from "@/components/layout/AgentsColumn/AgentTreemap";
import { DepositToAgentModal } from "@/components/layout/DepositToAgent/DepositToAgentModal";
import { GetWalletModal } from "@/components/layout/DepositToAgent/GetWalletModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAgentBalance } from "@/store/slices/agentsSlice";
import { addRecent } from "@/store/slices/recentSlice";
import { formatCollateral } from "@/lib/formatNumbers";
import { getWalletBalances } from "@/lib/balances";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";

const AGENTS_LIMIT = 50;
const BALANCE_REFRESH_MS = 50000;

async function fetchOnChainBalances(agents: Agent[]): Promise<Record<string, string>> {
  const withWallet = agents.filter((a) => a.walletAddress && String(a.walletAddress).trim());
  if (withWallet.length === 0) return {};
  const results = await Promise.allSettled(
    withWallet.map((a) =>
      getWalletBalances(a.walletAddress!).then((b) => ({ id: a.id, usdc: b.usdc }))
    )
  );
  const map: Record<string, string> = {};
  results.forEach((r) => {
    if (r.status === "fulfilled" && r.value) map[r.value.id] = r.value.usdc;
  });
  return map;
}

export interface TrackerAgentColumnProps {
  selectedAgentId: string | null;
  onSelectAgent: (agent: Agent | null) => void;
  className?: string;
}

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${formatCollateral(pnl)}`;
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
  const liveBalances = useAppSelector((state) => state.agents.balanceByAgentId);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [onChainBalances, setOnChainBalances] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentForDeposit, setAgentForDeposit] = useState<Agent | null>(null);
  const [agentForGetWallet, setAgentForGetWallet] = useState<Agent | null>(null);

  const refetchAgents = useCallback(() => {
    setRefreshing(true);
    getMyAgents({ limit: AGENTS_LIMIT })
      .then((res) => {
        const list = res.data ?? [];
        setAgents(list);
        return fetchOnChainBalances(list);
      })
      .then((balances) => {
        setOnChainBalances(balances);
      })
      .catch(() => {})
      .finally(() => {
        setRefreshing(false);
      });
  }, []);

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
          return fetchOnChainBalances(list);
        }
      })
      .then((balances) => {
        if (!cancelled && balances != null) setOnChainBalances(balances);
      })
      .catch((err) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Sign in to see your agents.";
          setError(message);
          setAgents([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [onSelectAgent, selectedAgentId]);

  useEffect(() => {
    if (!agents.length) return;
    const interval = setInterval(refetchAgents, BALANCE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [agents.length, refetchAgents]);

  useMarketSocket({
    agentIds: agents.map((a) => a.id),
    enabled: agents.length > 0,
  });

  useEffect(() => {
    if (selectedAgentId == null) return;
    syncAgentBalance(selectedAgentId)
      .then((res) => {
        if (res.balance != null) {
          dispatch(setAgentBalance({ agentId: selectedAgentId, balance: res.balance }));
        }
      })
      .catch(() => {});
  }, [selectedAgentId, dispatch]);

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
          <AgentTreemap agents={agents} simpleOnly />
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
              const hasWallet = agent.hasCompleteWallet === true;
              const pnl = agent.pnl ?? 0;
              const pnlClass = pnl >= 0 ? "text-success" : "text-danger";
              return (
                <li key={agent.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (!isSelected) {
                        dispatch(addRecent({ type: "agent", id: agent.id, label: agent.name }));
                      }
                      onSelectAgent(isSelected ? null : agent);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        if (!isSelected) {
                          dispatch(addRecent({ type: "agent", id: agent.id, label: agent.name }));
                        }
                        onSelectAgent(isSelected ? null : agent);
                      }
                    }}
                    className={`flex w-full gap-3 border-b border-border bg-surface p-3 text-left transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset cursor-pointer ${
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
                        <span className="text-muted">
                          Bal{" "}
                          {refreshing ? (
                            <span className="inline-block h-3.5 w-10 animate-pulse rounded bg-muted" aria-hidden />
                          ) : (
                            formatCollateral(liveBalances[agent.id] ?? onChainBalances[agent.id] ?? agent.balance)
                          )}
                        </span>
                        <span className={pnlClass}>PnL {formatPnl(pnl)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasWallet) setAgentForDeposit(agent);
                        else setAgentForGetWallet(agent);
                      }}
                      className="shrink-0 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                      style={{ backgroundColor: "var(--color-success)" }}
                      aria-label={
                        hasWallet
                          ? `Deposit to ${agent.name || "agent"}`
                          : `Get wallet for ${agent.name || "agent"}`
                      }
                    >
                      {hasWallet ? "Deposit" : "Get wallet"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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

      {selectedAgent != null && (
        <>
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
