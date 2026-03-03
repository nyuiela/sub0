"use client";

import { useState } from "react";
import { SimulateProbabilityChart } from "./SimulateProbabilityChart";
import { SimulatePositionsColumn } from "./SimulatePositionsColumn";
import { List, FileText, Scale } from "lucide-react";

export interface SimulateProbabilityChartColumnProps {
  selectedAgentId: string | null;
  className?: string;
}

type TabId = "bidTable" | "positions" | "decisions";

export function SimulateProbabilityChartColumn({
  selectedAgentId,
  className = "",
}: SimulateProbabilityChartColumnProps) {
  const [activeTab, setActiveTab] = useState<TabId>("bidTable");

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Graph - Always on top */}
      <div className="mb-3">
        <SimulateProbabilityChart
          title="Implied Probability"
          subtitle="Live backtest simulation tracking"
          simulateLive={!!selectedAgentId}
          simulationInterval={2000}
          height={200}
          className="mb-2"
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-border mb-3">
        <button
          type="button"
          onClick={() => setActiveTab("bidTable")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === "bidTable"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <Scale className="h-3.5 w-3.5" />
          Bid Table
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("positions")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === "positions"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <List className="h-3.5 w-3.5" />
          Positions
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("decisions")}
          className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 ${activeTab === "decisions"
            ? "border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          <FileText className="h-3.5 w-3.5" />
          Decisions
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "bidTable" ? (
          <SimulateBidTable selectedAgentId={selectedAgentId} />
        ) : activeTab === "positions" ? (
          <SimulatePositionsColumn
            selectedAgentId={selectedAgentId}
            className="h-full"
          />
        ) : (
          <SimulateDecisions selectedAgentId={selectedAgentId} />
        )}
      </div>
    </div>
  );
}

// Bid Table Component
function SimulateBidTable({ selectedAgentId }: { selectedAgentId: string | null }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Order Book</h4>
      {selectedAgentId ? (
        <div className="space-y-1">
          {/* Bid Orders */}
          <div className="rounded border border-border bg-surface p-2">
            <h5 className="text-xs font-medium text-success mb-1">Bids</h5>
            <div className="space-y-1">
              <BidRow price={0.65} amount={100} total={65} type="bid" />
              <BidRow price={0.60} amount={250} total={150} type="bid" />
              <BidRow price={0.55} amount={500} total={275} type="bid" />
            </div>
          </div>

          {/* Ask Orders */}
          <div className="rounded border border-border bg-surface p-2">
            <h5 className="text-xs font-medium text-danger mb-1">Asks</h5>
            <div className="space-y-1">
              <BidRow price={0.70} amount={200} total={140} type="ask" />
              <BidRow price={0.75} amount={150} total={112.5} type="ask" />
              <BidRow price={0.80} amount={100} total={80} type="ask" />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select an agent to view order book.</p>
      )}
    </div>
  );
}

function BidRow({ price, amount, total, type }: { price: number; amount: number; total: number; type: "bid" | "ask" }) {
  return (
    <div className="flex items-center justify-between text-xs py-1 border-b border-border last:border-0">
      <span className={`font-mono ${type === "bid" ? "text-success" : "text-danger"}`}>
        {(price * 100).toFixed(1)}¢
      </span>
      <span className="text-muted-foreground">{amount.toLocaleString()}</span>
      <span className="text-foreground font-medium">${total.toFixed(2)}</span>
    </div>
  );
}

// Decisions Component
function SimulateDecisions({ selectedAgentId }: { selectedAgentId: string | null }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Agent Decisions</h4>
      {selectedAgentId ? (
        <div className="space-y-2">
          <DecisionItem
            timestamp="2024-01-15 14:23:05"
            action="BUY"
            market="Will BTC reach $50k by March?"
            reasoning="Market sentiment positive, technical indicators show upward momentum"
            confidence={0.78}
          />
          <DecisionItem
            timestamp="2024-01-15 14:20:12"
            action="HOLD"
            market="Will ETH 2.0 launch on time?"
            reasoning="Insufficient data, waiting for more signals"
            confidence={0.45}
          />
          <DecisionItem
            timestamp="2024-01-15 14:15:33"
            action="SELL"
            market="Will inflation drop below 3%?"
            reasoning="Economic indicators suggest sustained inflation"
            confidence={0.82}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Select an agent to view decisions.</p>
      )}
    </div>
  );
}

function DecisionItem({ timestamp, action, market, reasoning, confidence }: {
  timestamp: string;
  action: "BUY" | "SELL" | "HOLD";
  market: string;
  reasoning: string;
  confidence: number;
}) {
  const actionColor = action === "BUY" ? "text-success" : action === "SELL" ? "text-danger" : "text-muted-foreground";

  return (
    <div className="rounded border border-border bg-surface p-2 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground">{timestamp}</span>
        <span className={`font-semibold ${actionColor}`}>{action}</span>
      </div>
      <p className="text-foreground font-medium mb-1">{market}</p>
      <p className="text-muted-foreground mb-1">{reasoning}</p>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">Confidence:</span>
        <span className="font-medium text-foreground">{(confidence * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
