"use client";

import { useRef, useCallback, useLayoutEffect, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useMarketSocket } from "@/lib/websocket/useMarketSocket";
import type { TradeExecutedPayload } from "@/lib/websocket/websocket-types";
import type { OHLCV } from "@/types/chart.types";

const CANDLE_INTERVAL_SEC = 60;
const PLACEHOLDER_CANDLES_COUNT = 100;
const PLACEHOLDER_BASE_PRICE = 0.5;
const PLACEHOLDER_VOLATILITY = 0.02;

function generatePlaceholderCandles(): OHLCV[] {
  const now = Math.floor(Date.now() / 1000);
  const start = now - PLACEHOLDER_CANDLES_COUNT * CANDLE_INTERVAL_SEC;
  const candles: OHLCV[] = [];
  let close = PLACEHOLDER_BASE_PRICE;
  for (let i = 0; i < PLACEHOLDER_CANDLES_COUNT; i++) {
    const time = start + i * CANDLE_INTERVAL_SEC;
    const open = close;
    const change = (Math.random() - 0.48) * PLACEHOLDER_VOLATILITY;
    close = Math.max(0.01, Math.min(0.99, open + change));
    const high = Math.max(open, close) + Math.random() * PLACEHOLDER_VOLATILITY * 0.5;
    const low = Math.min(open, close) - Math.random() * PLACEHOLDER_VOLATILITY * 0.5;
    candles.push({
      time,
      open,
      high: Math.max(high, open, close),
      low: Math.min(low, open, close),
      close,
    });
  }
  return candles;
}
const BATCH_FLUSH_MS = 100;
const CHART_BG = "#0F172A";
const GRID_COLOR = "#1E293B";
const UP_COLOR = "#22C55E";
const DOWN_COLOR = "#EF4444";
const PRICE_PRECISION = 6;

function toCandleTime(isoDate: string): number {
  const ts = Math.floor(new Date(isoDate).getTime() / 1000);
  return Math.floor(ts / CANDLE_INTERVAL_SEC) * CANDLE_INTERVAL_SEC;
}

function parsePrice(value: string): number {
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

export interface TradingChartProps {
  marketId: string;
  className?: string;
}

export function TradingChart({ marketId, className = "" }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [lastClose, setLastClose] = useState<number | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState(false);
  const setLastCloseRef = useRef(setLastClose);
  setLastCloseRef.current = setLastClose;
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lastCandleRef = useRef<{ time: number; open: number; high: number; low: number; close: number } | null>(null);
  const batchRef = useRef<TradeExecutedPayload[]>([]);
  const flushScheduledRef = useRef(false);
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushBatch = useCallback(() => {
    const batch = batchRef.current;
    if (batch.length === 0 || !seriesRef.current) return;
    batchRef.current = [];
    flushScheduledRef.current = false;

    const sorted = [...batch].sort(
      (a, b) => new Date(a.executedAt).getTime() - new Date(b.executedAt).getTime()
    );
    let open = 0;
    let high = -Infinity;
    let low = Infinity;
    let close = 0;
    let candleTime = 0;

    for (const p of sorted) {
      const t = toCandleTime(p.executedAt);
      const price = parsePrice(p.price);
      if (candleTime === 0) {
        candleTime = t;
        open = lastCandleRef.current?.close ?? price;
        high = Math.max(open, price);
        low = Math.min(open, price);
        close = price;
      } else if (t === candleTime) {
        high = Math.max(high, price);
        low = Math.min(low, price);
        close = price;
      } else {
        const bar = {
          time: candleTime as UTCTimestamp,
          open,
          high: high === -Infinity ? open : high,
          low: low === Infinity ? open : low,
          close,
        };
        seriesRef.current.update(bar);
        lastCandleRef.current = { ...bar, time: candleTime };
        candleTime = t;
        open = close;
        high = Math.max(open, price);
        low = Math.min(open, price);
        close = price;
      }
    }
    const bar = {
      time: candleTime as UTCTimestamp,
      open,
      high: high === -Infinity ? open : high,
      low: low === Infinity ? open : low,
      close,
    };
    lastCandleRef.current = { ...bar, time: candleTime };
    seriesRef.current.update(bar);
    setLastCloseRef.current?.(bar.close);
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushScheduledRef.current) return;
    flushScheduledRef.current = true;
    flushTimeoutRef.current = setTimeout(flushBatch, BATCH_FLUSH_MS);
  }, [flushBatch]);

  const onTradeExecuted = useCallback((payload: TradeExecutedPayload) => {
    if (payload.marketId !== marketId) return;
    batchRef.current.push(payload);
    scheduleFlush();
  }, [marketId, scheduleFlush]);

  useMarketSocket({
    marketId: marketId || null,
    enabled: Boolean(marketId),
    onTradeExecuted,
  });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !marketId) return;

    const chart = createChart(container, {
      layout: {
        background: { type: "solid", color: CHART_BG },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: GRID_COLOR },
        horzLines: { color: GRID_COLOR },
      },
      rightPriceScale: {
        borderColor: GRID_COLOR,
        scaleMargins: { top: 0.1, bottom: 0.2 },
        precision: PRICE_PRECISION,
        minMove: 10 ** -PRICE_PRECISION,
      },
      timeScale: {
        borderColor: GRID_COLOR,
        timeVisible: true,
        secondsVisible: false,
      },
      localization: {
        locale: typeof navigator !== "undefined" ? navigator.language : "en",
      },
      autoSize: false,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    chartRef.current = chart;
    seriesRef.current = series;
    lastCandleRef.current = null;

    const applySize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) chart.resize(w, h);
    };
    const ro = new ResizeObserver(applySize);
    ro.observe(container);
    requestAnimationFrame(applySize);

    let cancelled = false;
    fetch(`/api/markets/${marketId}/candles?interval=1m&limit=100`)
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((body: { data?: OHLCV[] }) => {
        if (cancelled || !seriesRef.current) return;
        let data = body?.data ?? [];
        const usedPlaceholder = data.length === 0;
        if (data.length === 0) data = generatePlaceholderCandles();
        const mapped = data.map((d) => ({
          time: d.time as UTCTimestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        seriesRef.current.setData(mapped);
        const last = mapped[mapped.length - 1];
        lastCandleRef.current = {
          time: last.time as number,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        };
        if (!cancelled) {
          setLastClose(last.close);
          setIsPlaceholder(usedPlaceholder);
        }
      })
      .catch(() => {
        if (cancelled || !seriesRef.current) return;
        const data = generatePlaceholderCandles();
        const mapped = data.map((d) => ({
          time: d.time as UTCTimestamp,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }));
        seriesRef.current?.setData(mapped);
        const last = mapped[mapped.length - 1];
        lastCandleRef.current = {
          time: last.time as number,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        };
        setLastClose(last.close);
        setIsPlaceholder(true);
      });

    return () => {
      cancelled = true;
      if (flushTimeoutRef.current != null) {
        clearTimeout(flushTimeoutRef.current);
        flushTimeoutRef.current = null;
      }
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      lastCandleRef.current = null;
    };
  }, [marketId]);

  return (
    <figure className={`flex w-full flex-col ${className}`.trim()}>
      <section
        ref={containerRef}
        className="w-full"
        aria-label="Trading chart"
        style={{ minHeight: 280, height: 280 }}
      />
      <figcaption className="mt-1 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-muted-foreground">
        <span>
          {lastClose != null && (
            <>
              Last: <span className="tabular-nums font-medium text-foreground">{lastClose.toFixed(4)}</span>
              {isPlaceholder && (
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5">Placeholder (no history)</span>
              )}
            </>
          )}
        </span>
        <span>1m candles</span>
      </figcaption>
    </figure>
  );
}
