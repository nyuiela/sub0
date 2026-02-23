"use client";

import { useState } from "react";

export interface TrackerStatsColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

type StatsTab = "statistics" | "news";

export function TrackerStatsColumn({
  selectedAgentId,
  className = "",
}: TrackerStatsColumnProps) {
  const [tab, setTab] = useState<StatsTab>("statistics");

  if (selectedAgentId == null) {
    return (
      <aside
        className={`flex flex-col items-center justify-center rounded bg-surface p-6 text-sm text-muted-foreground ${className}`.trim()}
        aria-label="Statistics"
      >
        <p>Select an agent to view statistics and charts.</p>
      </aside>
    );
  }

  return (
    <aside
      className={`flex flex-col overflow-hidden ${className}`.trim()}
      aria-label="Statistics and news"
    >
      <nav
        role="tablist"
        aria-label="Statistics or News"
        className="flex border-b border-border bg-surface"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === "statistics"}
          aria-controls="tracker-stats-panel"
          id="tracker-tab-statistics"
          onClick={() => setTab("statistics")}
          className={`min-w-[100px] border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "statistics"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Statistics
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "news"}
          aria-controls="tracker-news-panel"
          id="tracker-tab-news"
          onClick={() => setTab("news")}
          className={`min-w-[100px] border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
            tab === "news"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          News
        </button>
      </nav>

      <div className="flex-1 overflow-auto bg-surface">
        {tab === "statistics" && (
          <div
            id="tracker-stats-panel"
            role="tabpanel"
            aria-labelledby="tracker-tab-statistics"
            className="flex flex-col gap-4 p-4"
          >
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                PnL
              </h3>
              <div className="h-24 rounded bg-muted/30 p-3 text-sm text-muted-foreground">
                Chart: PnL over time (AgentTrack) – coming soon.
              </div>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Strategy
              </h3>
              <p className="text-sm text-muted-foreground">
                Preference (AMM / Orderbook / Hybrid), slippage, spread – chart or summary.
              </p>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Tokens used
              </h3>
              <p className="text-sm text-muted-foreground">
                LLM usage – requires Agent.tokensUsed or AgentUsage in DB.
              </p>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Risks
              </h3>
              <p className="text-sm text-muted-foreground">
                Exposure, drawdown – derived or AgentRiskSnapshot.
              </p>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Activities
              </h3>
              <p className="text-sm text-muted-foreground">
                Trades, orders, positions held – counts and list (Order needs agentId in DB for orders).
              </p>
            </section>
          </div>
        )}
        {tab === "news" && (
          <div
            id="tracker-news-panel"
            role="tabpanel"
            aria-labelledby="tracker-tab-news"
            className="flex flex-col gap-4 p-4"
          >
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                News thought based on
              </h3>
              <p className="text-sm text-muted-foreground">
                FeedItem / News the agent used – from AiLog payload or AgentFeedItem (see DB changes).
              </p>
            </section>
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                AI logs
              </h3>
              <p className="text-sm text-muted-foreground">
                AiLog entries (action, payload) for this agent – coming soon.
              </p>
            </section>
          </div>
        )}
      </div>
    </aside>
  );
}
