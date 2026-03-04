"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, type IChartApi, type ISeriesApi, AreaSeries, type AreaSeriesPartialOptions, type Time, type AreaData } from "lightweight-charts";
import type { OHLCV } from "@/types/chart.types";
import type { MarketPricesResponse } from "@/types/prices.types";
import { formatOutcomePrice } from "@/lib/formatNumbers";

const CHART_H = 320;
const OUTCOME_COLORS = ["#22C55E", "#3B82F6", "#A855F7", "#F59E0B"];

export type OutcomeChartYAxisMode = "probability" | "price";

export interface OutcomeProbabilityChartProps {
  marketId: string;
  marketPrices?: MarketPricesResponse | null;
  className?: string;
}

interface LegendItem {
  label: string;
  color: string;
  value: number;
}

function buildAreaData(candles: OHLCV[]): AreaData<Time>[] {
  return candles.map((c) => ({
    time: c.time as Time,
    value: Math.max(0, Math.min(1, c.close)),
  }));
}

export function OutcomeProbabilityChart({
  marketId,
  marketPrices,
  className = "",
}: OutcomeProbabilityChartProps) {
  const [seriesData, setSeriesData] = useState<{ outcomeIndex: number; label: string; data: AreaData<Time>[] }[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "done">("idle");
  const [yAxisMode, setYAxisMode] = useState<OutcomeChartYAxisMode>("probability");
  const [legendItems, setLegendItems] = useState<LegendItem[]>([]);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area">[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!marketId) return;
    let cancelled = false;
    const outcomes = marketPrices?.options?.length ?? 1;
    const outcomeFetches = Array.from({ length: outcomes }, (_, i) =>
      fetch(
        `/api/markets/${marketId}/candles?resolution=1m&limit=200&outcomeIndex=${i}`
      )
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((body: { data?: OHLCV[] }) => body?.data ?? [])
    );
    queueMicrotask(() => {
      if (!cancelled) setLoadState("loading");
    });
    Promise.all(outcomeFetches)
      .then((results) => {
        if (cancelled) return;

        // Always create series for all outcomes, even if some have no data
        const withLabels = results.map((data, i) => ({
          outcomeIndex: i,
          label: marketPrices?.options?.[i]?.label ?? `Outcome ${i}`,
          data: data.length > 0 ? buildAreaData(data) : [],
        }));

        setSeriesData(withLabels);
        setLoadState("done");
      })
      .catch(() => {
        if (!cancelled) {
          setSeriesData([]);
          setLoadState("done");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [marketId, marketPrices?.options]);

  useEffect(() => {
    if (!chartContainerRef.current || seriesData.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = [];
    }

    const chart = createChart(chartContainerRef.current, {
      height: CHART_H,
      layout: {
        background: { color: "#0F172A" },
        textColor: "#94a3b8",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      },
      grid: {
        vertLines: { color: "#1e293b" },
        horzLines: { color: "#1e293b" },
      },
      rightPriceScale: {
        borderColor: "#334155",
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: "#475569",
          labelBackgroundColor: "#475569",
        },
        horzLine: {
          color: "#475569",
          labelBackgroundColor: "#475569",
        },
      },
      autoSize: true,
    });

    chartRef.current = chart;

    if (yAxisMode === "probability") {
      chart.priceScale("right").applyOptions({
        minValue: 0,
        maxValue: 100,
      });
    } else {
      chart.priceScale("right").applyOptions({
        minValue: 0,
        maxValue: 1,
      });
    }

    seriesData.forEach((series, i) => {
      const baseColor = OUTCOME_COLORS[i % OUTCOME_COLORS.length];
      const seriesOptions: AreaSeriesPartialOptions = {
        lineColor: baseColor,
        lineWidth: 2,
        topColor: `${baseColor}40`, // 25% opacity
        bottomColor: `${baseColor}05`, // ~2% opacity
        priceFormat: {
          type: "custom",
          formatter: (price: number) => {
            if (yAxisMode === "probability") {
              return `${price.toFixed(0)}%`;
            }
            return formatOutcomePrice(price);
          },
        },
        lastValueVisible: false,
        title: series.label,
      };

      const areaSeries = chart.addSeries(AreaSeries, seriesOptions);

      if (series.data.length > 0) {
        const displayData = series.data.map((d) => ({
          time: d.time,
          value: yAxisMode === "probability" ? d.value * 100 : d.value,
        }));
        areaSeries.setData(displayData);
      }

      seriesRef.current.push(areaSeries);
    });

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setLegendItems(
          seriesData.map((s, i) => ({
            label: s.label,
            color: OUTCOME_COLORS[i % OUTCOME_COLORS.length],
            value: yAxisMode === "probability"
              ? (s.data[s.data.length - 1]?.value ?? 0) * 100
              : s.data[s.data.length - 1]?.value ?? 0,
          }))
        );
        return;
      }

      const items: LegendItem[] = [];
      seriesRef.current.forEach((series, i) => {
        const dataPoint = param.seriesData.get(series);
        const seriesInfo = seriesData[i];
        if (dataPoint && typeof dataPoint.value === "number" && seriesInfo) {
          items.push({
            label: seriesInfo.label,
            color: OUTCOME_COLORS[i % OUTCOME_COLORS.length],
            value: dataPoint.value,
          });
        }
      });
      setLegendItems(items);
    });

    setLegendItems(
      seriesData.map((s, i) => ({
        label: s.label,
        color: OUTCOME_COLORS[i % OUTCOME_COLORS.length],
        value: yAxisMode === "probability"
          ? (s.data[s.data.length - 1]?.value ?? 0) * 100
          : s.data[s.data.length - 1]?.value ?? 0,
      }))
    );

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = [];
      }
    };
  }, [seriesData, yAxisMode]);

  const hasHistory = seriesData.some((s) => s.data.length > 0);
  const options = marketPrices?.options ?? [];
  const showChart = loadState === "done" && seriesData.length > 0;

  return (
    <figure className={`flex w-full flex-col ${className}`.trim()}>
      {showChart && (
        <nav
          className="flex items-center gap-2 bg-[#0F172A] px-2 py-1.5"
          aria-label="Chart Y-axis mode"
        >
          <span className="text-xs text-muted-foreground">Y-axis:</span>
          <select
            value={yAxisMode}
            onChange={(e) =>
              setYAxisMode(e.target.value as OutcomeChartYAxisMode)
            }
            className="rounded bg-surface px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Select Y-axis scale"
          >
            <option value="probability">Probability (0–100%)</option>
            <option value="price">Price</option>
          </select>
        </nav>
      )}
      {!showChart ? (
        <section
          className="flex w-full flex-col justify-center gap-3 rounded bg-[#0F172A] px-4 py-6"
          aria-label="Current outcome probability"
          style={{ minHeight: CHART_H, height: CHART_H }}
        >
          <p className="text-center text-sm text-muted-foreground">
            No history yet. Current probability (LMSR):
          </p>
          <div className="flex flex-col gap-2">
            {options.map((o, i) => {
              const p = Number(o.instantPrice);
              const pct = Number.isFinite(p)
                ? Math.max(0, Math.min(1, p)) * 100
                : 0;
              const color = OUTCOME_COLORS[i % OUTCOME_COLORS.length];
              return (
                <div key={o.outcomeIndex} className="flex items-center gap-2">
                  <span className="w-16 text-sm font-medium text-foreground">
                    {o.label}
                  </span>
                  <div
                    className="h-2 flex-1 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="w-12 text-right text-sm font-bold text-foreground">
                    {pct.toFixed(1)}%
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : showChart ? (
        <section className="relative w-full">
          {/* Interactive Legend Overlay */}
          <div className="pointer-events-none absolute left-2 top-2 z-10 rounded border border-border bg-[#0F172A]/90 px-2 py-1.5 shadow-lg">
            <div className="flex flex-col gap-1">
              {legendItems.length === 0
                ? seriesData.map((s, i) => (
                  <div key={s.outcomeIndex} className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: OUTCOME_COLORS[i % OUTCOME_COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </div>
                ))
                : legendItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs text-foreground">{item.label}</span>
                    </div>
                    <span className="text-xs font-mono font-medium text-foreground">
                      {yAxisMode === "probability" ? `${item.value.toFixed(1)}%` : formatOutcomePrice(item.value)}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Chart Container */}
          <div
            ref={chartContainerRef}
            className="rounded bg-[#0F172A]"
            style={{ height: CHART_H }}
          />
        </section>
      ) : (
        <section
          className="flex w-full items-center justify-center rounded bg-[#0F172A] text-muted-foreground"
          aria-label="Chart loading"
          style={{ minHeight: CHART_H, height: CHART_H }}
        >
          {loadState === "loading" ? "Loading…" : "No data"}
        </section>
      )}
      <figcaption className="mt-1 flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {loadState === "loading" && (
            <span>Loading probability history…</span>
          )}
          {options.length > 0 && (
            <span className="tabular-nums">
              {options
                .map((o) => `${o.label}: ${formatOutcomePrice(o.instantPrice)}`)
                .join(" | ")}
            </span>
          )}
        </span>
        <span>
          {hasHistory
            ? `${yAxisMode === "probability" ? "Probability" : "Price"} over time (digital line). Zoom, pan, scroll.`
            : "Live probability from LMSR"}
        </span>
      </figcaption>
    </figure>
  );
}
