"use client";

import type { Market } from "@/types/market.types";
import type { MarketPricesResponse } from "@/types/prices.types";

export interface MarketInfoPanelProps {
  market: Market;
  /** LMSR prices; used for liquidity parameter and outcome prices. */
  marketPrices?: MarketPricesResponse | null;
  className?: string;
}

function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return `${str.slice(0, len)}...`;
}

export function MarketInfoPanel({ market, marketPrices, className = "" }: MarketInfoPanelProps) {
  const volume = market.totalVolume ?? market.volume ?? "0";
  const liquidity =
    marketPrices?.liquidityParameter ?? market.liquidity ?? null;
  const confidence = market.confidence ?? null;

  return (
    <section
      className={`flex min-h-0 flex-col gap-4 rounded-sm border border-border bg-surface p-4 ${className}`}
      aria-label="Token and strategy info"
    >
      <article aria-label="Token information">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Token information</h3>
        <dl className="space-y-1.5 text-sm">
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Volume</dt>
            <dd className="tabular-nums text-foreground">{volume}</dd>
          </div>
          {liquidity != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Liquidity (b)</dt>
              <dd className="tabular-nums text-foreground">{liquidity}</dd>
            </div>
          )}
          {marketPrices?.options != null && marketPrices.options.length > 0 && (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">Outcome prices</dt>
              <dd className="flex flex-wrap gap-x-3 gap-y-1">
                {marketPrices.options.map((o) => (
                  <span key={o.outcomeIndex} className="tabular-nums text-foreground">
                    {o.label}: {Number(o.instantPrice).toFixed(4)}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {confidence != null && (
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Confidence</dt>
              <dd className="tabular-nums text-foreground">{confidence}</dd>
            </div>
          )}
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Condition ID</dt>
            <dd className="font-mono text-xs text-foreground">{truncate(market.conditionId, 16)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground">{market.status}</dd>
          </div>
        </dl>
      </article>
      <article aria-label="Strategy">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Strategy</h3>
        <p className="text-sm text-muted-foreground">
          Strategy and risk parameters. Connect to API when available.
        </p>
      </article>
      <article aria-label="Agents">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Agents</h3>
        <p className="text-sm text-muted-foreground">
          {market.agentsEngagingCount != null
            ? `${market.agentsEngagingCount} agent(s) engaging.`
            : "Agent activity. Connect to API when available."}
        </p>
      </article>
    </section>
  );
}
