"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addRecent } from "@/store/slices/recentSlice";
import { useRecentTrades } from "@/lib/websocket/useLiveMarketData";
import { LiveTimeDisplay } from "@/components/LiveTimeDisplay";
import { formatOutcomePrice, formatOutcomeQuantity } from "@/lib/formatNumbers";
import { getBlockExplorerTxUrl } from "@/lib/blockExplorer";
import { getTxHashFromCrePayload } from "@/types/order.types";
import type { RecentTradeItem } from "@/store/slices/recentTradesSlice";

export interface TradesColumnProps {
  /** Max trades to show. Default 30. */
  limit?: number;
  className?: string;
}

function resolveTradeTxHash(item: RecentTradeItem): string | null {
  if (item.txHash) return item.txHash;
  return getTxHashFromCrePayload(item.crePayload) ?? null;
}

function TradeRow({
  item,
  marketName,
  dispatch,
}: {
  item: RecentTradeItem;
  marketName: string;
  dispatch: ReturnType<typeof useAppDispatch>;
}) {
  const sideClass = item.side === "long" ? "text-success" : "text-danger";
  const txHash = resolveTradeTxHash(item);
  const txUrl = useMemo(
    () => (txHash ? getBlockExplorerTxUrl(undefined, txHash) : undefined),
    [txHash]
  );
  return (
    <li>
      <section className="border-b border-border bg-surface p-3 transition-colors last:border-b-0 hover:bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground">
          <Link
            href={`/market/${item.marketId}`}
            onClick={() =>
              dispatch(
                addRecent({
                  type: "market",
                  id: item.marketId,
                  label: marketName,
                })
              )
            }
            className="line-clamp-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {marketName}
          </Link>
        </h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={sideClass}>{item.side}</span>
          <span className="text-muted-foreground">
            {formatOutcomePrice(item.price)} <span className="text-muted">x</span> {formatOutcomeQuantity(item.size)}
          </span>
          {txUrl && (
            <a
              href={txUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono"
              title="View on block explorer"
            >
              Tx {txHash?.slice(0, 8)}...
            </a>
          )}
        </div>
        <p className="mt-1 text-[10px] text-muted">
          <LiveTimeDisplay createdAt={item.executedAt} />
          {item.agentId != null ? (
            <span className="ml-1"> agent {item.agentId.slice(0, 8)}...</span>
          ) : null}
        </p>
      </section>
    </li>
  );
}

export function TradesColumn({ limit = 30, className = "" }: TradesColumnProps) {
  const dispatch = useAppDispatch();
  const trades = useRecentTrades();
  const { list, selectedMarket } = useAppSelector((state) => state.markets);
  const marketNameById = useMemo(() => {
    const map: Record<string, string> = {};
    if (selectedMarket?.id != null) {
      map[selectedMarket.id] = selectedMarket.name ?? selectedMarket.id.slice(0, 8);
    }
    for (const m of list) {
      if (m.id != null && !(m.id in map)) {
        map[m.id] = m.name ?? m.id.slice(0, 8);
      }
    }
    return map;
  }, [list, selectedMarket]);

  const shown = trades.slice(0, limit);

  if (shown.length === 0) {
    return (
      <article
        className={`flex flex-col ${className}`.trim()}
        aria-label="Live trades"
      >
        <p className="p-3 text-sm text-muted-foreground">
          No live trades yet. Trades appear here as they execute on subscribed markets.
        </p>
      </article>
    );
  }

  return (
    <article
      className={`flex flex-col ${className}`.trim()}
      aria-label="Live trades"
    >
      <ul className="space-y-0">
        {shown.map((item) => (
          <TradeRow
            key={item.id}
            item={item}
            marketName={marketNameById[item.marketId] ?? item.marketId.slice(0, 8)}
            dispatch={dispatch}
          />
        ))}
      </ul>
    </article>
  );
}
