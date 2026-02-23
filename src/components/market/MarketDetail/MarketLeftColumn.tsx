"use client";

import { useState } from "react";
import type { MarketPricesResponse } from "@/types/prices.types";

export type MarketLeftTabId = "assets" | "history" | "orders";

export interface MarketLeftColumnProps {
  marketId: string;
  /** LMSR prices; shown in Assets tab when available. */
  marketPrices?: MarketPricesResponse | null;
  className?: string;
}

const TABS: { id: MarketLeftTabId; label: string }[] = [
  { id: "assets", label: "Assets" },
  { id: "history", label: "History" },
  { id: "orders", label: "Orders" },
];

export function MarketLeftColumn({ marketId, marketPrices, className = "" }: MarketLeftColumnProps) {
  const [activeTab, setActiveTab] = useState<MarketLeftTabId>("assets");

  return (
    <aside
      className={`flex min-h-0 flex-col rounded-sm bg-surface ${className}`}
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
