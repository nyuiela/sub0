"use client";

import { useState } from "react";
import { ActivityTab } from "./ActivityTab";
import { HoldersTab } from "./HoldersTab";
import { TradersTab } from "./TradersTab";
import type {
  ActivityItem,
  MarketHolderItem,
  MarketTraderItem,
} from "@/types/activity.types";

export type MarketDetailTabId = "activity" | "holders" | "traders";

export interface MarketDetailTabsProps {
  marketId: string;
  holdersCount: number;
  activityItems?: ActivityItem[];
  holders?: MarketHolderItem[];
  traders?: MarketTraderItem[];
  className?: string;
}

const TABS: { id: MarketDetailTabId; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "holders", label: "Holders" },
  { id: "traders", label: "Traders" },
];

export function MarketDetailTabs({
  marketId,
  holdersCount,
  activityItems = [],
  holders = [],
  traders = [],
  className = "",
}: MarketDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<MarketDetailTabId>("activity");

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-sm bg-surface ${className}`}
      aria-label="Market details"
    >
      <nav role="tablist" className="flex">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          const tabLabel = id === "holders" ? `Holders (${holdersCount})` : label;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              id={`tab-${id}`}
              type="button"
              className={`min-w-[100px] border-b-2 px-4 py-3 text-sm font-medium transition-colors ${isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              onClick={() => setActiveTab(id)}
            >
              {tabLabel}
            </button>
          );
        })}
      </nav>
      <div className="min-h-0 flex-1 overflow-auto p-4" role="tabpanel" id="panel-activity" aria-labelledby="tab-activity" hidden={activeTab !== "activity"}>
        {activeTab === "activity" && <ActivityTab marketId={marketId} items={activityItems} />}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4" role="tabpanel" id="panel-holders" aria-labelledby="tab-holders" hidden={activeTab !== "holders"}>
        {activeTab === "holders" && <HoldersTab marketId={marketId} count={holdersCount} holders={holders} />}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4" role="tabpanel" id="panel-traders" aria-labelledby="tab-traders" hidden={activeTab !== "traders"}>
        {activeTab === "traders" && <TradersTab marketId={marketId} traders={traders} />}
      </div>
    </section>
  );
}
