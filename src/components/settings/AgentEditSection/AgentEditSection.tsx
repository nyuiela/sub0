"use client";

import { useEffect, useState } from "react";
import { getAgent, syncAgentBalance } from "@/lib/api/agents";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAgentBalance } from "@/store/slices/agentsSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { formatCollateral } from "@/lib/formatNumbers";
import type { Agent } from "@/types/agent.types";

export interface AgentEditSectionProps {
  agentId: string;
}

export function AgentEditSection({ agentId }: AgentEditSectionProps) {
  const dispatch = useAppDispatch();
  const liveBalance = useAppSelector((state) => state.agents.balanceByAgentId[agentId]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useMarketSocket({
    agentIds: agentId ? [agentId] : [],
    enabled: Boolean(agentId),
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoading(true);
        setError(null);
      }
    });
    getAgent(agentId)
      .then((a) => {
        if (!cancelled) setAgent(a);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load agent");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    syncAgentBalance(agentId)
      .then((res) => {
        if (res.balance != null) {
          dispatch(setAgentBalance({ agentId, balance: res.balance }));
        }
      })
      .catch(() => {});
  }, [agentId, dispatch]);

  if (loading) {
    return (
      <section className="flex flex-1 flex-col overflow-auto px-4 py-6" aria-busy="true">
        <p className="text-sm text-muted">Loading agent…</p>
      </section>
    );
  }

  if (error ?? !agent) {
    return (
      <section className="flex flex-1 flex-col overflow-auto px-4 py-6">
        <p className="text-sm text-danger" role="alert">
          {error ?? "Agent not found."}
        </p>
      </section>
    );
  }

  return (
    <section
      className="flex flex-1 flex-col gap-6 overflow-auto px-4 py-6"
      aria-labelledby="agent-edit-heading"
    >
      <h2 id="agent-edit-heading" className="sr-only">
        Manage agent: {agent.name}
      </h2>
      <article className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-foreground">Details</h3>
        <dl className="mt-3 grid gap-2 text-sm">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="font-medium text-foreground">{agent.name}</dd>
          </div>
          {agent.persona != null && agent.persona !== "" && (
            <div>
              <dt className="text-muted">Persona</dt>
              <dd className="text-foreground">{agent.persona}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">Status</dt>
            <dd className="text-foreground">{agent.status}</dd>
          </div>
          {agent.template != null && (
            <div>
              <dt className="text-muted">Template</dt>
              <dd className="text-foreground">{agent.template.name}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">Balance</dt>
            <dd className="text-foreground">
              {formatCollateral(liveBalance ?? agent.balance)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Trades</dt>
            <dd className="text-foreground">{agent.totalTrades}</dd>
          </div>
          <div>
            <dt className="text-muted">PnL</dt>
            <dd className="text-foreground">{agent.pnl}</dd>
          </div>
        </dl>
      </article>
      <article className="rounded-lg border border-border bg-surface p-4">
        <h3 className="text-sm font-medium text-foreground">Strategy</h3>
        <p className="mt-2 text-sm text-muted">
          {agent.strategy != null
            ? `Preference: ${agent.strategy.preference ?? "—"}, slippage: ${agent.strategy.maxSlippage ?? "—"}`
            : "No strategy configured."}
        </p>
      </article>
    </section>
  );
}
