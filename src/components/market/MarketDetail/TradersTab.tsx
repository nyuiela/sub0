"use client";

import type { MarketTraderItem } from "@/types/activity.types";

export interface TradersTabProps {
  marketId: string;
  traders?: MarketTraderItem[];
}

function truncate(str: string, head = 8, tail = 4): string {
  if (str.length <= head + tail + 2) return str;
  return `${str.slice(0, head)}...${str.slice(-tail)}`;
}

function displayTraderLabel(t: MarketTraderItem): string {
  if (t.userId != null && t.agentId != null) return `User ${truncate(t.userId)} / Agent ${truncate(t.agentId)}`;
  if (t.userId != null) return truncate(t.userId);
  if (t.agentId != null) return `Agent ${truncate(t.agentId)}`;
  return "-";
}

export function TradersTab({ marketId, traders = [] }: TradersTabProps) {
  return (
    <section aria-label="Traders">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 text-left font-medium">Trader</th>
              <th className="py-2 text-right font-medium">Trades</th>
              <th className="py-2 text-right font-medium">Volume</th>
            </tr>
          </thead>
          <tbody>
            {traders.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  No trader data yet for this market.
                </td>
              </tr>
            ) : (
              traders.map((t, i) => (
                <tr key={`${t.userId ?? ""}-${t.agentId ?? ""}-${i}`} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2 font-mono text-xs">{displayTraderLabel(t)}</td>
                  <td className="py-2 text-right tabular-nums">{t.tradeCount}</td>
                  <td className="py-2 text-right tabular-nums">{t.totalVolume}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
