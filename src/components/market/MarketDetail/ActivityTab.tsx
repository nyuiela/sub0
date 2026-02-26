"use client";

import { formatOutcomePrice, formatOutcomeQuantity, formatCollateral } from "@/lib/formatNumbers";
import type {
  ActivityItem,
  ActivityTradePayload,
  ActivityPositionPayload,
  ActivityNewsPayload,
  ActivityAgentPayload,
} from "@/types/activity.types";

export interface ActivityTabProps {
  marketId: string;
  items?: ActivityItem[];
}

function truncateId(id: string, head = 8, tail = 4): string {
  if (id.length <= head + tail + 2) return id;
  return `${id.slice(0, head)}...${id.slice(-tail)}`;
}

function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function TradeRow({ item, payload }: { item: ActivityItem; payload: ActivityTradePayload }) {
  const side = payload.side === "BID" ? "long" : "short";
  const who =
    payload.userId != null
      ? truncateId(payload.userId)
      : payload.agentId != null
        ? truncateId(payload.agentId)
        : "-";
  return (
    <tr className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-2 capitalize">{item.type}</td>
      <td className="py-2 text-right">
        <span className={side === "long" ? "text-green-600" : "text-red-600"}>{side}</span>
      </td>
      <td className="py-2 text-right tabular-nums">{formatOutcomeQuantity(payload.amount)}</td>
      <td className="py-2 text-right tabular-nums">{formatOutcomePrice(payload.price)}</td>
      <td className="py-2 font-mono text-xs">{who}</td>
      <td className="py-2 text-right text-muted-foreground">{formatTimeAgo(payload.createdAt)}</td>
    </tr>
  );
}

function PositionRow({ item, payload }: { item: ActivityItem; payload: ActivityPositionPayload }) {
  const who =
    payload.address
      ? truncateId(payload.address, 6, 4)
      : payload.userId != null
        ? truncateId(payload.userId)
        : payload.agentId != null
          ? truncateId(payload.agentId)
          : "-";
  return (
    <tr className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-2 capitalize">{item.type}</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 text-right tabular-nums">{formatCollateral(payload.collateralLocked)}</td>
      <td className="py-2 text-right tabular-nums">{formatOutcomePrice(payload.avgPrice)}</td>
      <td className="py-2 font-mono text-xs">{who}</td>
      <td className="py-2 text-right text-muted-foreground">{formatTimeAgo(payload.updatedAt)}</td>
    </tr>
  );
}

function NewsRow({ item, payload }: { item: ActivityItem; payload: ActivityNewsPayload }) {
  return (
    <tr className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-2 capitalize">{item.type}</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2">
        {payload.sourceUrl != null ? (
          <a
            href={payload.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {payload.title || "Link"}
          </a>
        ) : (
          payload.title || "-"
        )}
      </td>
      <td className="py-2 text-right text-muted-foreground">{formatTimeAgo(payload.createdAt)}</td>
    </tr>
  );
}

function AgentActivityRow({ item, payload }: { item: ActivityItem; payload: ActivityAgentPayload }) {
  return (
    <tr className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-2">{payload.activityType}</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 text-right">-</td>
      <td className="py-2 font-mono text-xs">{truncateId(payload.agentId)}</td>
      <td className="py-2 text-right text-muted-foreground">{formatTimeAgo(payload.createdAt)}</td>
    </tr>
  );
}

export function ActivityTab({ marketId, items = [] }: ActivityTabProps) {
  return (
    <section aria-label="Market activity">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="py-2 text-left font-medium">Type</th>
              <th className="py-2 text-right font-medium">Side</th>
              <th className="py-2 text-right font-medium">Amount</th>
              <th className="py-2 text-right font-medium">Price</th>
              <th className="py-2 text-left font-medium">Who / Link</th>
              <th className="py-2 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  No activity yet for this market.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const p = item.payload;
                if (p.type === "trade") return <TradeRow key={item.id} item={item} payload={p} />;
                if (p.type === "position") return <PositionRow key={item.id} item={item} payload={p} />;
                if (p.type === "news") return <NewsRow key={item.id} item={item} payload={p} />;
                if (p.type === "agent_activity") return <AgentActivityRow key={item.id} item={item} payload={p} />;
                return null;
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
