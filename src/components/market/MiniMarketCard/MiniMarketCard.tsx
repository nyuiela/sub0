"use client";

import Link from "next/link";
import Image from "next/image";
import { useAppDispatch } from "@/store/hooks";
import { addRecent } from "@/store/slices/recentSlice";
import { getDiceBearAvatarUrl } from "@/lib/avatar";
import type { Market } from "@/types/market.types";

const AVATAR_SIZE = 94;

function formatMc(value: string | undefined): string {
  if (value == null || value === "") return "0";
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

function formatTimeAgo(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) return `${diffSec}s`;
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHour < 24) return `${diffHour}h`;
    if (diffDay < 7) return `${diffDay}d`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function truncateAddress(addr: string, head = 4, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}..${addr.slice(-tail)}`;
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
  const volume = market.totalVolume ?? market.volume ?? "0";
  const mcFormatted = formatMc(volume);
  const vFormatted = volume && !Number.isNaN(Number(volume))
    ? Number(volume).toFixed(1)
    : "0";
  const outcomes = Array.isArray(market.outcomes)
    ? market.outcomes.map((o) => (typeof o === "string" ? o : String(o)))
    : ["Yes", "No"];
  const timeOrId = market.createdAt
    ? formatTimeAgo(market.createdAt)
    : truncateAddress(market.creatorAddress, 4, 6);
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
            className="h-12 w-12 rounded-sm object-cover"
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
            className="h-12 w-12 rounded-sm object-cover"
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
          {timeOrId}
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
              className={`cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                addedCount > 0
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
