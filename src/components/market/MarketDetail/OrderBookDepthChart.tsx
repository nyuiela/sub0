"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectOrderBookByMarketId } from "@/store/slices/marketsSlice";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import { formatOutcomePrice } from "@/lib/formatNumbers";
import type { OrderBookLevel } from "@/types/market.types";

const DEPTH_CHART_HEIGHT = 200;
const PAD = 32;
const BID_COLOR = "#22C55E";
const BID_FILL = "rgba(34, 197, 94, 0.35)";
const ASK_COLOR = "#EF4444";
const ASK_FILL = "rgba(239, 68, 68, 0.35)";

function toNum(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function buildCumulative(
  levels: OrderBookLevel[],
  priceAsc: boolean
): { price: number; quantity: number; cumVolume: number }[] {
  const sorted = [...levels].sort((a, b) => {
    const pa = toNum(a.price);
    const pb = toNum(b.price);
    return priceAsc ? pa - pb : pb - pa;
  });
  let cum = 0;
  return sorted.map((l) => {
    const q = toNum(l.quantity);
    cum += q;
    return { price: toNum(l.price), quantity: q, cumVolume: cum };
  });
}

export interface OrderBookDepthChartProps {
  marketId: string;
  outcomeIndex?: number;
  className?: string;
}

/**
 * Market depth chart: cumulative bid/ask volume vs price (SciChart-style).
 * Uses order book from Redux (live via useMarketSocket). No external chart lib.
 */
export function OrderBookDepthChart({
  marketId,
  outcomeIndex = 0,
  className = "",
}: OrderBookDepthChartProps) {
  useMarketSocket({ marketId, enabled: Boolean(marketId) });
  const snapshot = useAppSelector((state) =>
    selectOrderBookByMarketId(state, marketId, outcomeIndex)
  );
  const bids = snapshot?.bids ?? [];
  const asks = snapshot?.asks ?? [];

  const { pathBids, pathAsks, priceMin, priceMax, volMax, width, height } =
    useMemo(() => {
      const bidPoints = buildCumulative(bids, false);
      const askPoints = buildCumulative(asks, true);
      const allPrices = [
        ...bidPoints.map((p) => p.price),
        ...askPoints.map((p) => p.price),
      ].filter((p) => p > 0);
      const pMin = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      const pMax = allPrices.length > 0 ? Math.max(...allPrices) : 1;
      const range = pMax - pMin || 1;
      const maxBid = bidPoints[bidPoints.length - 1]?.cumVolume ?? 0;
      const maxAsk = askPoints[askPoints.length - 1]?.cumVolume ?? 0;
      const volMaxVal = Math.max(maxBid, maxAsk, 1);
      const w = 300;
      const h = DEPTH_CHART_HEIGHT;
      const x = (p: number) => PAD + ((p - pMin) / range) * (w - 2 * PAD);
      const y = (v: number) => h - PAD - (v / volMaxVal) * (h - 2 * PAD);

      const bottom = h - PAD;
      let pathBid = "";
      if (bidPoints.length > 0) {
        const x0 = x(bidPoints[0].price);
        const xn = x(bidPoints[bidPoints.length - 1].price);
        pathBid = `M ${x0} ${bottom} L ${x0} ${y(bidPoints[0].cumVolume)}`;
        for (let i = 1; i < bidPoints.length; i++) {
          pathBid += ` L ${x(bidPoints[i].price)} ${y(bidPoints[i].cumVolume)}`;
        }
        pathBid += ` L ${xn} ${bottom} Z`;
      }

      let pathAsk = "";
      if (askPoints.length > 0) {
        const x0 = x(askPoints[0].price);
        const xn = x(askPoints[askPoints.length - 1].price);
        pathAsk = `M ${x0} ${bottom} L ${x0} ${y(askPoints[0].cumVolume)}`;
        for (let i = 1; i < askPoints.length; i++) {
          pathAsk += ` L ${x(askPoints[i].price)} ${y(askPoints[i].cumVolume)}`;
        }
        pathAsk += ` L ${xn} ${bottom} Z`;
      }

      return {
        pathBids: pathBid,
        pathAsks: pathAsk,
        priceMin: pMin,
        priceMax: pMax,
        volMax: volMaxVal,
        width: w,
        height: h,
      };
    }, [bids, asks]);

  const hasData = bids.length > 0 || asks.length > 0;

  return (
    <article
      className={`rounded-md bg-surface p-3 ${className}`}
      aria-label="Order book depth chart"
    >
      <header className="mb-2 pb-2">
        <h3 className="text-sm font-medium text-foreground">Depth</h3>
      </header>
      {hasData ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ height: DEPTH_CHART_HEIGHT }}
          aria-hidden
        >
          <path d={pathBids} fill={BID_FILL} stroke={BID_COLOR} strokeWidth={1} />
          <path d={pathAsks} fill={ASK_FILL} stroke={ASK_COLOR} strokeWidth={1} />
          <text
            x={PAD}
            y={12}
            className="fill-muted-foreground text-[10px]"
            textAnchor="start"
          >
            Vol
          </text>
          <text
            x={width - PAD}
            y={height - 4}
            className="fill-muted-foreground text-[10px]"
            textAnchor="end"
          >
            Price {formatOutcomePrice(priceMin)} – {formatOutcomePrice(priceMax)}
          </text>
        </svg>
      ) : (
        <div
          className="flex items-center justify-center text-sm text-muted-foreground"
          style={{ height: DEPTH_CHART_HEIGHT }}
        >
          No depth data
        </div>
      )}
    </article>
  );
}
