"use client";

import type { MarketHolderItem } from "@/types/activity.types";

export interface HoldersTabProps {
  marketId: string;
  count: number;
  holders?: MarketHolderItem[];
}

function truncate(str: string, head = 6, tail = 4): string {
  if (str.length <= head + tail + 2) return str;
  return `${str.slice(0, head)}...${str.slice(-tail)}`;
}

function displayHolderLabel(h: MarketHolderItem): string {
  if (h.address) return truncate(h.address, 6, 4);
  if (h.userId != null) return truncate(h.userId, 8, 4);
  if (h.agentId != null) return `Agent ${truncate(h.agentId, 8, 4)}`;
  return "-";
}

export function HoldersTab({ marketId, count, holders = [] }: HoldersTabProps) {
  return (
    <section aria-label={`Holders (${count})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 text-left font-medium">Holder</th>
              <th className="py-2 text-right font-medium">Positions</th>
              <th className="py-2 text-right font-medium">Open</th>
            </tr>
          </thead>
          <tbody>
            {holders.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-muted-foreground">
                  No holder data yet for this market.
                </td>
              </tr>
            ) : (
              holders.map((h, i) => (
                <tr key={`${h.userId ?? ""}-${h.agentId ?? ""}-${h.address}-${i}`} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-2 font-mono text-xs">{displayHolderLabel(h)}</td>
                  <td className="py-2 text-right tabular-nums">{h.positionCount}</td>
                  <td className="py-2 text-right tabular-nums">{h.openPositionCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
