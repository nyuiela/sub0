"use client";

import { useCallback, useEffect, useState } from "react";
import { getPositions } from "@/lib/api/positions";
import { getAgent, getAgentReasoning } from "@/lib/api/agents";
import type { Agent } from "@/types/agent.types";
import type { AgentReasoning } from "@/types/agent.types";
import type { MarketPricesResponse } from "@/types/prices.types";
import type { Position } from "@/types/position.types";

export type MarketLeftTabId = "assets" | "statistic";

export interface MarketLeftColumnProps {
  marketId: string;
  marketPrices?: MarketPricesResponse | null;
  className?: string;
}

const TABS: { id: MarketLeftTabId; label: string }[] = [
  { id: "assets", label: "Assets" },
  { id: "statistic", label: "Statistic" },
];

function formatPnl(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "";
  return `${sign}${Number(pnl).toFixed(2)}`;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MarketLeftColumn({ marketId, marketPrices, className = "" }: MarketLeftColumnProps) {
  const [activeTab, setActiveTab] = useState<MarketLeftTabId>("assets");
  const [positions, setPositions] = useState<Position[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [reasoningByAgent, setReasoningByAgent] = useState<Record<string, AgentReasoning[]>>({});
  const [statisticLoading, setStatisticLoading] = useState(false);

  const loadStatistic = useCallback(async () => {
    if (!marketId) return;
    setStatisticLoading(true);
    try {
      const posRes = await getPositions({ marketId, limit: 100 });
      const posList = posRes.data ?? [];
      setPositions(posList);
      const agentIds = Array.from(new Set(posList.map((p) => p.agentId).filter(Boolean))) as string[];
      if (agentIds.length === 0) {
        setAgents([]);
        setReasoningByAgent({});
        return;
      }
      const [agentList, ...reasoningResults] = await Promise.all([
        Promise.all(agentIds.map((id) => getAgent(id).catch(() => null))),
        ...agentIds.map((id) =>
          getAgentReasoning(id, { limit: 30 }).then((r) => ({ id, data: r.data ?? [] }))
        ),
      ]);
      setAgents(agentList.filter((a): a is Agent => a != null));
      const reasoningMap: Record<string, AgentReasoning[]> = {};
      reasoningResults.forEach((r: { id: string; data: AgentReasoning[] }) => {
        reasoningMap[r.id] = (r.data ?? []).filter((item) => item.marketId === marketId);
      });
      setReasoningByAgent(reasoningMap);
    } catch {
      setPositions([]);
      setAgents([]);
      setReasoningByAgent({});
    } finally {
      setStatisticLoading(false);
    }
  }, [marketId]);

  useEffect(() => {
    if (activeTab === "statistic") loadStatistic();
  }, [activeTab, loadStatistic]);

  const hasTraded = positions.length > 0;

  return (
    <aside
      className={`flex min-h-0 flex-col rounded-sm bg-surface ${className}`.trim()}
      aria-label="Market sidebar"
      data-market-id={marketId}
    >
      <nav role="tablist" className="flex">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-left-${id}`}
              id={`tab-left-${id}`}
              type="button"
              className={`flex-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div
          role="tabpanel"
          id="panel-left-assets"
          aria-labelledby="tab-left-assets"
          hidden={activeTab !== "assets"}
        >
          {activeTab === "assets" && (
            <>
              {marketPrices?.options != null && marketPrices.options.length > 0 ? (
                <ul className="space-y-2 text-sm" aria-label="Outcome prices">
                  {marketPrices.options.map((o) => (
                    <li
                      key={o.outcomeIndex}
                      className="flex justify-between gap-2 rounded bg-muted/30 px-2 py-1.5"
                    >
                      <span className="font-medium text-foreground">{o.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {Number(o.instantPrice).toFixed(4)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Asset list for this market. Connect to API when available.
                </p>
              )}
            </>
          )}
        </div>
        <div
          role="tabpanel"
          id="panel-left-statistic"
          aria-labelledby="tab-left-statistic"
          hidden={activeTab !== "statistic"}
        >
          {activeTab === "statistic" && (
            <div className="space-y-4 text-sm">
              {statisticLoading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : !hasTraded ? (
                <p className="text-muted-foreground">
                  No agent has traded on this market yet. Statistics will appear when your agent has a position here.
                </p>
              ) : (
                <>
                  {agents.map((agent) => {
                    const pnl = agent.pnl ?? 0;
                    const winRate = agent.winRate ?? 0;
                    const reasoning = reasoningByAgent[agent.id] ?? [];
                    return (
                      <section
                        key={agent.id}
                        className="rounded border border-border bg-muted/20 p-3"
                        aria-label={`Agent ${agent.name} stats`}
                      >
                        <h4 className="font-semibold text-foreground">
                          {agent.name || agent.id.slice(0, 8)}
                        </h4>
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <dt className="text-muted-foreground">PnL</dt>
                          <dd className={pnl >= 0 ? "text-success" : "text-danger"}>
                            {formatPnl(pnl)}
                          </dd>
                          <dt className="text-muted-foreground">Win rate</dt>
                          <dd className="text-foreground">
                            {Math.round(winRate * 100)}%
                          </dd>
                        </dl>
                        <h5 className="mt-3 text-xs font-semibold text-muted-foreground">
                          Reasoning & logs (this market)
                        </h5>
                        {reasoning.length === 0 ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No reasoning entries for this market.
                          </p>
                        ) : (
                          <ul className="mt-1 space-y-2" aria-label="Reasoning logs">
                            {reasoning.slice(0, 10).map((item) => (
                              <li
                                key={item.id}
                                className="rounded bg-background/80 px-2 py-1.5 text-xs"
                              >
                                <span className="text-muted-foreground">
                                  {formatTime(item.createdAt)}
                                </span>
                                <p className="mt-0.5 line-clamp-2 text-foreground">
                                  {item.reasoning || item.response || item.actionTaken || "—"}
                                </p>
                                {item.actionTaken && (
                                  <span className="mt-1 inline-block text-muted-foreground">
                                    {item.actionTaken}
                                  </span>
                                )}
                              </li>
                            ))}
                            {reasoning.length > 10 && (
                              <li className="text-xs text-muted-foreground">
                                +{reasoning.length - 10} more
                              </li>
                            )}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
