"use client";

import { useMemo } from "react";
import { FlipNumber } from "@/components/FlipNumber";
import type { OrderBookLevel } from "@/types/market.types";

export interface OrderFillBarProps {
  /** Bid levels (best first). Used to compute bid-side quantity total. */
  bids?: OrderBookLevel[];
  /** Ask levels (best first). Used to compute ask-side quantity total. */
  asks?: OrderBookLevel[];
  /** Optional: show percentage labels beside the bar. Default true. */
  showLabels?: boolean;
  /** Bar height in rem or px. Default 0.375rem (6px). */
  height?: string;
  className?: string;
}

function sumQuantity(levels: OrderBookLevel[]): number {
  let total = 0;
  for (const l of levels) {
    const q = Number(l.quantity);
    if (Number.isFinite(q) && q > 0) total += q;
  }
  return total;
}

/**
 * Progressive bid/ask fill bar: green (bid) and red (ask) segments by order book quantity.
 * Live-updates when bids/asks change. Shows percentages e.g. 66% bid, 44% ask.
 */
export function OrderFillBar({
  bids = [],
  asks = [],
  showLabels = true,
  height = "0.375rem",
  className = "",
}: OrderFillBarProps) {
  const { bidPct, askPct, hasData } = useMemo(() => {
    const bidTotal = sumQuantity(Array.isArray(bids) ? bids : []);
    const askTotal = sumQuantity(Array.isArray(asks) ? asks : []);
    const total = bidTotal + askTotal;
    if (total <= 0) {
      return { bidPct: 50, askPct: 50, hasData: false };
    }
    const bidPct = Math.round((bidTotal / total) * 100);
    const askPct = 100 - bidPct;
    return { bidPct, askPct, hasData: true };
  }, [bids, asks]);

  if (!hasData && !showLabels) return null;

  const bidWidth = `${bidPct}%`;
  const askWidth = `${askPct}%`;

  return (
    <div
      className={`flex items-center gap-2 ${className}`.trim()}
      role="progressbar"
      aria-valuenow={bidPct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Order book fill: ${bidPct}% bid, ${askPct}% ask`}
    >
      {showLabels && (
        <span className="text-[10px] font-medium text-success tabular-nums shrink-0">
          Bid <FlipNumber value={`${bidPct}%`} />
        </span>
      )}
      <div
        className="flex w-full min-w-0 rounded-full overflow-hidden bg-muted/40"
        style={{ height }}
      >
        <span
          className="bg-success transition-[width] duration-300 ease-out"
          style={{ width: bidWidth }}
        />
        <span
          className="bg-danger transition-[width] duration-300 ease-out"
          style={{ width: askWidth }}
        />
      </div>
      {showLabels && (
        <span className="text-[10px] font-medium text-danger tabular-nums shrink-0">
          Ask <FlipNumber value={`${askPct}%`} />
        </span>
      )}
    </div>
  );
}
