"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectOrderBookByMarketId } from "@/store/slices/marketsSlice";
import { addRecent } from "@/store/slices/recentSlice";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import type { Market } from "@/types/market.types";

const AVATAR_SIZE = 194;

function formatMc(value: string | undefined): string {
  if (value == null || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

function formatTimeAgo(iso: string, now: Date = new Date()): string {
  try {
    const d = new Date(iso);
    const diffMs = now.getTime() - d.getTime();
    const totalSec = Math.floor(diffMs / 1000);
    if (totalSec < 0) return "0s";

    const diffDay = Math.floor(totalSec / 86400);
    const diffHour = Math.floor((totalSec % 86400) / 3600);
    const diffMin = Math.floor((totalSec % 3600) / 60);
    const sec = totalSec % 60;

    if (diffDay >= 7) {
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    if (diffDay > 0) {
      return `${diffDay}d ${diffHour}h ${diffMin}m ${sec}s`;
    }
    if (diffHour > 0) {
      return `${diffHour}h ${diffMin}m ${sec}s`;
    }
    if (diffMin > 0) {
      return `${diffMin}m ${sec}s`;
    }
    return `${sec}s`;
  } catch {
    return "";
  }
}

function truncateAddress(addr: string, head = 4, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}..${addr.slice(-tail)}`;
}

interface LiveTimeDisplayProps {
  createdAt?: string;
  fallbackAddress?: string;
}

function LiveTimeDisplay({ createdAt, fallbackAddress }: LiveTimeDisplayProps) {
  const timeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!createdAt) return;

    const updateTime = () => {
      if (timeRef.current) {
        timeRef.current.textContent = formatTimeAgo(createdAt, new Date());
      }
    };

    updateTime();
    const intervalId = setInterval(updateTime, 1000);

    return () => clearInterval(intervalId);
  }, [createdAt]);

  if (!createdAt) {
    return <span>{truncateAddress(fallbackAddress ?? "", 4, 6)}</span>;
  }

  return <span ref={timeRef} />;
}

export interface MiniMarketCardProps {
  market: Market;
  onBuy?: (market: Market) => void;
  onSell?: (market: Market) => void;
  /** Called when user clicks "Add to agent" to assign this market to an agent for trading. */
  onAddToAgent?: (market: Market) => void;
  /** Agent IDs that have been added to this market (for button label and modal selection). */
  addedAgentIds?: string[];
  quickBuyAmount?: string;
  /** When false, Buy/Sell actions are hidden (e.g. tracker column). Default true. */
  showActions?: boolean;
  className?: string;
}

export function MiniMarketCard({
  market,
  onBuy,
  onSell,
  onAddToAgent,
  addedAgentIds = [],
  quickBuyAmount = "$100",
  showActions = true,
  className = "",
}: MiniMarketCardProps) {
  const addedCount = addedAgentIds.length;
  const dispatch = useAppDispatch();
  const orderBook = useAppSelector((state) =>
    selectOrderBookByMarketId(state, market.id, 0)
  );
  const bestBid = orderBook?.bids?.[0]?.price;
  const bestAsk = orderBook?.asks?.[0]?.price;

  const volume = market.totalVolume ?? market.volume ?? "0";
  const mcFormatted = formatMc(volume);
  const vFormatted = volume && !Number.isNaN(Number(volume))
    ? Number(volume).toFixed(1)
    : "0";
  const outcomes = Array.isArray(market.outcomes)
    ? market.outcomes.map((o) => (typeof o === "string" ? o : String(o)))
    : ["Yes", "No"];
  const activeOrders = market.activeOrderCount ?? 0;
  const totalTrades = market.totalTrades ?? 0;
  const qDisplay = totalTrades >= 1000 ? `${(totalTrades / 1000).toFixed(2)}K` : String(totalTrades);

  return (
    <article
      className={`flex gap-3 border-b border-border bg-surface p-3 ${className} mb-2`}
      aria-labelledby={`market-name-${market.id}`}
    >
      <figure className="shrink-0" aria-hidden>
        {market.imageUrl ? (
          <Image
            src={market.imageUrl}
            alt=""
            width={AVATAR_SIZE}
            height={AVATAR_SIZE}
            className="h-24 w-24 rounded-sm object-cover"
            loading="lazy"
            unoptimized
          />
        ) : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- DiceBear data URI */}
            <img
              src={getDiceBearAvatarUrl(market.id, "market")}
              alt=""
              width={AVATAR_SIZE}
              height={AVATAR_SIZE}
              className="h-24 w-24 rounded-sm object-cover"
              loading="lazy"
            />
          </>
        )}
      </figure>

      <section className="min-w-0 flex-1 flex flex-col gap-1.5" aria-label="Market info">
        <div className="flex items-center gap-1.5">
          <h2 id={`market-name-${market.id}`} className="text-sm font-semibold line-clamp-2 text-ellipsis">
            <Link
              href={`/market/${market.id}`}
              onClick={() => dispatch(addRecent({ type: "market", id: market.id, label: market.name }))}
              className="text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              {market.name}
            </Link>
          </h2>
        </div>
        <p className="text-xs text-success" aria-label="Time or countdown">
          <LiveTimeDisplay
            createdAt={market.createdAt}
            fallbackAddress={market.creatorAddress}
          />
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="text-muted" aria-label="Orders and trades">
            <span className="text-foreground font-medium">Q</span> {activeOrders}<span className="text-muted">/</span>{qDisplay}
          </span>
          <span className="text-muted" aria-label="Holders">
            <span className="text-foreground font-medium">H</span> {market.uniqueStakersCount ?? 0}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5" aria-label="Outcome probabilities">
          {outcomes.length > 0
            ? outcomes.slice(0, 5).map((outcome, i) => {
              const isFirst = i === 0;
              const isSecond = i === 1;
              const raw = market.outcomePrices?.[i];
              const pct =
                raw != null && raw !== ""
                  ? `${(Math.max(0, Math.min(1, Number(raw))) * 100).toFixed(1)}%`
                  : "—";
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${isFirst
                    ? "bg-success/20 text-success"
                    : isSecond
                      ? "bg-danger/20 text-danger"
                      : "bg-muted/50 text-muted"
                    }`}
                >
                  {pct}
                </span>
              );
            })
            : (
              <span className="rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted">
                —
              </span>
            )}
        </div>
        {(bestBid != null || bestAsk != null) && (
          <p className="text-[10px] text-muted" aria-label="Best bid and ask">
            <span className="text-success">Bid {bestBid ?? "—"}</span>
            <span className="mx-1 text-muted">|</span>
            <span className="text-danger">Ask {bestAsk ?? "—"}</span>
          </p>
        )}
        <p className="text-[10px] text-muted">
          <span className="text-muted">{(market.conditionId ?? "").slice(0, 4)}…{(market.conditionId ?? "").slice(-4)}</span>
          <span className="text-success"> F </span>${Number(volume) > 0 ? (Number(volume) * 0.01).toFixed(3) : "0"}
          <span className="text-info"> TX </span>{market.totalTrades ?? 0}
        </p>
      </section>

      <aside className="flex shrink-0 flex-col items-end justify-between gap-2" aria-label="Metrics and actions">
        <div className="flex flex-col items-end text-right">
          <p className="text-xs font-medium text-foreground">
            MC ${mcFormatted}
          </p>
          <p className="text-xs text-muted">
            V ${vFormatted}
          </p>
        </div>
        {showActions && (
          <div className="mt-auto flex flex-col items-stretch gap-1.5">

            <button
              type="button"
              onClick={() => onAddToAgent?.(market)}
              disabled={market.status !== "OPEN"}
              className={`cursor-pointer rounded-md border border-transparent bg-success 
              px-3 py-1.5 text-xs font-medium text-white transition-opacity 
              hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 
              focus-visible:ring-primary focus-visible:ring-offset-2
                ${addedCount > 0
                  ? "border border-success bg-success/10 text-success focus-visible:ring-success"
                  : "border border-transparent bg-success text-white focus-visible:ring-success"
                }`}
              aria-label={addedCount > 0 ? `${market.name}: ${addedCount} agent(s) added` : `Add ${market.name} to agent`}
            >
              {addedCount > 0 ? `Added (${addedCount})` : "Add to agent"}
            </button>
            {onBuy != null && (
              <button
                type="button"
                onClick={() => onBuy(market)}
                disabled={market.status !== "OPEN"}
                className="cursor-pointer rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Buy ${quickBuyAmount} on ${market.name}`}
              >
                {quickBuyAmount}
              </button>
            )}
            {onSell != null && (
              <button
                type="button"
                onClick={() => onSell(market)}
                disabled={market.status !== "OPEN"}
                className="cursor-pointer rounded-lg bg-danger px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Sell on ${market.name}`}
              >
                Sell
              </button>
            )}
          </div>
        )}
      </aside>
    </article>
  );
}
