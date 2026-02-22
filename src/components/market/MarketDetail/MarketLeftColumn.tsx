"use client";

import { useState } from "react";

export type MarketLeftTabId = "assets" | "history" | "orders";

export interface MarketLeftColumnProps {
  marketId: string;
  className?: string;
}

const TABS: { id: MarketLeftTabId; label: string }[] = [
  { id: "assets", label: "Assets" },
  { id: "history", label: "History" },
  { id: "orders", label: "Orders" },
];

export function MarketLeftColumn({ marketId, className = "" }: MarketLeftColumnProps) {
  const [activeTab, setActiveTab] = useState<MarketLeftTabId>("assets");

  return (
    <aside
      className={`flex min-h-0 flex-col rounded-sm border border-border bg-surface ${className}`}
      aria-label="Market sidebar"
    >
      <nav role="tablist" className="flex border-b border-border">
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
              className={`flex-1 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${isActive
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
            <p className="text-sm text-muted-foreground">
              Asset list for this market. Connect to API when available.
            </p>
          )}
        </div>
        <div
          role="tabpanel"
          id="panel-left-history"
          aria-labelledby="tab-left-history"
          hidden={activeTab !== "history"}
        >
          {activeTab === "history" && (
            <p className="text-sm text-muted-foreground">
              Trade and position history. Connect to API when available.
            </p>
          )}
        </div>
        <div
          role="tabpanel"
          id="panel-left-orders"
          aria-labelledby="tab-left-orders"
          hidden={activeTab !== "orders"}
        >
          {activeTab === "orders" && (
            <p className="text-sm text-muted-foreground">
              Open and past orders. Connect to API when available.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
