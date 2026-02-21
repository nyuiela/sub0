"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectOrderBookByMarketId } from "@/store/slices/marketsSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import type { OrderBookLevel } from "@/types/market.types";

const BID_ASK_MAX_ROWS = 12;

export interface MarketOrderBookProps {
  marketId: string;
  /** Max rows per side (bids / asks). Default 12. */
  maxRows?: number;
  className?: string;
}

function OrderBookSide({
  levels,
  side,
  maxRows,
}: {
  levels: OrderBookLevel[];
  side: "bid" | "ask";
  maxRows: number;
}) {
  const slice = useMemo(
    () => levels.slice(0, maxRows),
    [levels, side, maxRows]
  );

  return (
    <section aria-label={`Order book ${side}s`}>
      <table className="w-full table-fixed text-sm" role="grid">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="py-1.5 text-left font-medium">Price</th>
            <th className="py-1.5 text-right font-medium">Size</th>
          </tr>
        </thead>
        <tbody>
          {slice.length === 0 ? (
            <tr>
              <td colSpan={2} className="py-4 text-center text-muted-foreground">
                No {side}s
              </td>
            </tr>
          ) : (
            slice.map((level, i) => (
              <tr
                key={`${side}-${level.price}-${i}`}
                className="border-b border-border/50 hover:bg-muted/50"
              >
                <td
                  className={`py-1 pr-2 ${side === "bid" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {level.price}
                </td>
                <td className="py-1 text-right tabular-nums">{level.quantity}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

/**
 * Displays live order book for one market. Subscribes to market:{marketId}
 * via useMarketSocket and reads throttled order book updates from Redux.
 * Isolated re-renders: only this component updates when this market's order book changes.
 */
export function MarketOrderBook({
  marketId,
  maxRows = BID_ASK_MAX_ROWS,
  className = "",
}: MarketOrderBookProps) {
  useMarketSocket({ marketId, enabled: Boolean(marketId) });

  const snapshot = useAppSelector((state) =>
    selectOrderBookByMarketId(state, marketId)
  );

  const bids = snapshot?.bids ?? [];
  const asks = snapshot?.asks ?? [];

  return (
    <article
      className={`rounded-md border border-border bg-surface p-3 ${className}`}
      aria-label={`Order book for market ${marketId}`}
    >
      <header className="mb-2 border-b border-border pb-2">
        <h3 className="text-sm font-medium text-foreground">Order book</h3>
      </header>
      <div className="grid grid-cols-2 gap-4">
        <OrderBookSide levels={bids} side="bid" maxRows={maxRows} />
        <OrderBookSide levels={asks} side="ask" maxRows={maxRows} />
      </div>
    </article>
  );
}
