"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import type { OHLCV } from "@/types/chart.types";
import type { MarketPricesResponse } from "@/types/prices.types";
import { formatOutcomePrice } from "@/lib/formatNumbers";
import { OUTCOME_SERIES_COLORS, getSciChartThemeOverrides } from "@/lib/scichart/theme";

const CHART_H = 320;
const OUTCOME_COLORS = ["#22C55E", "#3B82F6", "#A855F7", "#F59E0B"];

export type OutcomeChartYAxisMode = "probability" | "price";

export interface OutcomeProbabilityChartProps {
  marketId: string;
  marketPrices?: MarketPricesResponse | null;
  className?: string;
}

interface SeriesPoint {
  time: number;
  value: number;
}

interface CandleSeries {
  outcomeIndex: number;
  label: string;
  data: SeriesPoint[];
}

function buildLineData(candles: OHLCV[]): SeriesPoint[] {
  return candles.map((c) => ({
    time: c.time,
    value: Math.max(0, Math.min(1, c.close)),
  }));
}

const SciChartReact = dynamic(
  () => import("scichart-react").then((m) => m.SciChartReact),
  { ssr: false }
);

export function OutcomeProbabilityChart({
  marketId,
  marketPrices,
  className = "",
}: OutcomeProbabilityChartProps) {
  const [seriesData, setSeriesData] = useState<CandleSeries[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "done">("idle");
  const [yAxisMode, setYAxisMode] = useState<OutcomeChartYAxisMode>("probability");
  const chartConfigRef = useRef<{
    seriesData: CandleSeries[];
    yAxisMode: OutcomeChartYAxisMode;
  }>({ seriesData: [], yAxisMode: "probability" });
  const wasmConfiguredRef = useRef(false);

  chartConfigRef.current = { seriesData, yAxisMode };

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
        const hasAny = results.some((d) => d.length > 0);
        if (hasAny) {
          const withLabels = results.map((data, i) => ({
            outcomeIndex: i,
            label: marketPrices?.options?.[i]?.label ?? `Outcome ${i}`,
            data: data.length > 0 ? buildLineData(data) : [],
          }));
          setSeriesData(withLabels);
          setLoadState("done");
          return;
        }
        return fetch(
          `/api/markets/${marketId}/candles?resolution=1m&limit=200`
        )
          .then((r) => (r.ok ? r.json() : { data: [] }))
          .then((body: { data?: OHLCV[] }) => body?.data ?? [])
          .then((data: OHLCV[]) => {
            if (cancelled) return;
            if (data.length > 0) {
              setSeriesData([
                {
                  outcomeIndex: 0,
                  label: marketPrices?.options?.[0]?.label ?? "Price",
                  data: buildLineData(data),
                },
              ]);
            }
            setLoadState("done");
          });
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

  const hasHistory = seriesData.some((s) => s.data.length > 0);
  const chartKey = `${yAxisMode}-${seriesData.map((s) => s.data.length).join("-")}`;

  const initChart = async (rootElement: string | HTMLDivElement) => {
    const el =
      typeof rootElement === "string"
        ? document.getElementById(rootElement)
        : rootElement;
    if (!el || !(el instanceof HTMLDivElement))
      throw new Error("Chart root element not found");
    const {
      SciChartSurface,
      NumericAxis,
      NumberRange,
      FastLineRenderableSeries,
      XyDataSeries,
      ZoomPanModifier,
      ZoomExtentsModifier,
      MouseWheelZoomModifier,
      EllipsePointMarker,
      SciChartJsNavyTheme,
    } = await import("scichart");

    if (!wasmConfiguredRef.current) {
      SciChartSurface.useWasmFromCDN();
      wasmConfiguredRef.current = true;
    }

    const { seriesData: data, yAxisMode: mode } = chartConfigRef.current;
    const baseTheme = new SciChartJsNavyTheme();
    const themeOverrides = getSciChartThemeOverrides();
    const { wasmContext, sciChartSurface } = await SciChartSurface.create(
      el,
      { theme: { ...baseTheme, ...themeOverrides } }
    );

    sciChartSurface.xAxes.add(
      new NumericAxis(wasmContext, {
        drawMinorGridLines: false,
        maxAutoTicks: 6,
      })
    );
    sciChartSurface.yAxes.add(
      new NumericAxis(wasmContext, {
        growBy: new NumberRange(0.05, 0.05),
        drawMinorGridLines: false,
        maxAutoTicks: 6,
      })
    );

    for (let i = 0; i < data.length; i++) {
      const s = data[i];
      if (s.data.length === 0) continue;
      const xValues = s.data.map((p) => p.time);
      const yValues = s.data.map((p) =>
        mode === "probability" ? p.value * 100 : p.value
      );
      const color = OUTCOME_SERIES_COLORS[i % OUTCOME_SERIES_COLORS.length];
      const dataSeries = new XyDataSeries(wasmContext, {
        xValues,
        yValues,
      });
      sciChartSurface.renderableSeries.add(
        new FastLineRenderableSeries(wasmContext, {
          dataSeries,
          stroke: color,
          strokeThickness: 2,
          isDigitalLine: true,
          pointMarker: new EllipsePointMarker(wasmContext, {
            width: 6,
            height: 6,
            fill: color,
            stroke: "#94a3b8",
            strokeThickness: 1,
          }),
        })
      );
    }

    sciChartSurface.chartModifiers.add(
      new ZoomPanModifier({ enableZoom: true }),
      new ZoomExtentsModifier(),
      new MouseWheelZoomModifier()
    );
    sciChartSurface.zoomExtents();

    return { sciChartSurface, wasmContext };
  };

  const options = marketPrices?.options ?? [];
  const showCurrentOnly =
    loadState === "done" && !hasHistory && options.length > 0;
  const showChart = hasHistory;

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
      {showCurrentOnly ? (
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
                  <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className="h-full rounded transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                  <span className="w-14 tabular-nums text-sm text-muted-foreground">
                    {formatOutcomePrice(pct / 100)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : showChart ? (
        <section
          className="w-full overflow-hidden rounded"
          aria-label="Outcome probability chart"
          style={{ minHeight: CHART_H, height: CHART_H }}
        >
          <SciChartReact
            key={chartKey}
            initChart={initChart}
            style={{ width: "100%", height: CHART_H, minHeight: CHART_H }}
            fallback={
              <div
                className="flex items-center justify-center text-muted-foreground"
                style={{ height: CHART_H }}
              >
                Loading chart…
              </div>
            }
          />
        </section>
      ) : (
        <section
          className="flex w-full items-center justify-center rounded bg-[#0F172A] text-muted-foreground"
          aria-label="Chart loading"
          style={{ minHeight: CHART_H, height: CHART_H }}
        >
          {loadState === "loading" ? "Loading…" : "No probability data"}
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
