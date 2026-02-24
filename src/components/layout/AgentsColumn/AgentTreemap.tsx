"use client";

import { useEffect, useRef, useState } from "react";
import { stratify, treemap } from "d3-hierarchy";
import type { Agent } from "@/types/agent.types";
import { getSciChartThemeOverrides } from "@/lib/scichart/theme";

const TREEMAP_WIDTH = 10;
const TREEMAP_HEIGHT = 8;
const CHART_HEIGHT_PX = 200;

interface TreemapNode {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  data: TreemapDataItem;
}

interface TreemapDataItem {
  name: string;
  shortName?: string;
  parent: string;
  value: number;
  progress: number;
}

function formatPnlForTreemap(pnl: number): string {
  if (pnl === 0) return "0";
  const sign = pnl > 0 ? "+" : "";
  return `${sign}${Number(pnl).toFixed(1)}`;
}

function prepareTreemapData(agents: Agent[]): TreemapDataItem[] {
  const items: TreemapDataItem[] = [
    { name: "Agents", parent: "", value: 0, progress: 0 },
  ];
  for (const a of agents) {
    const value = Math.max(0.01, (a.tradedAmount ?? 0) || (a.balance ?? 0) || 1);
    const progress = typeof a.pnl === "number" ? a.pnl : 0;
    items.push({
      name: a.id,
      shortName: a.name?.slice(0, 8) ?? a.id.slice(0, 8),
      parent: "Agents",
      value,
      progress,
    });
  }
  return items;
}

function prepareLayout(
  data: TreemapDataItem[]
): TreemapNode[] {
  const root = stratify<TreemapDataItem>()
    .id((d) => d.name)
    .parentId((d) => (d.parent === "" ? null : d.parent))(data);
  root.sum((d) => Number(d.value));
  treemap<TreemapDataItem>()
    .size([TREEMAP_WIDTH, TREEMAP_HEIGHT])
    .padding(0.08)(root);
  return root.leaves() as unknown as TreemapNode[];
}

export interface AgentTreemapProps {
  agents: Agent[];
  className?: string;
}

export function AgentTreemap({ agents, className = "" }: AgentTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<{ sciChartSurface: { delete: () => void }; wasmContext: unknown } | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    if (agents.length === 0) {
      setContainerReady(false);
      setChartError(null);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const checkSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerReady(rect.width >= 1 && rect.height >= 1);
    };
    requestAnimationFrame(() => {
      checkSize();
    });
    const ro = new ResizeObserver(checkSize);
    ro.observe(el);
    return () => {
      ro.disconnect();
      setContainerReady(false);
    };
  }, [agents.length]);

  useEffect(() => {
    if (!containerRef.current || agents.length === 0 || !containerReady) return;
    setChartError(null);
    const el = containerRef.current;
    let cancelled = false;

    const init = async () => {
      try {
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1 || cancelled) return;
        const scichart = await import("scichart");
      const [
        SciChartSurface,
        NumericAxis,
        NumberRange,
        FastRectangleRenderableSeries,
        XyxyDataSeries,
        EColumnMode,
        EColumnYMode,
        EResamplingMode,
        parseColorToUIntArgb,
        SciChartJsNavyTheme,
        TextAnnotation,
        ECoordinateMode,
        EVerticalAnchorPoint,
        EHorizontalAnchorPoint,
      ] = await Promise.all([
        Promise.resolve(scichart.SciChartSurface),
        Promise.resolve(scichart.NumericAxis),
        Promise.resolve(scichart.NumberRange),
        Promise.resolve(scichart.FastRectangleRenderableSeries),
        Promise.resolve(scichart.XyxyDataSeries),
        Promise.resolve(scichart.EColumnMode),
        Promise.resolve(scichart.EColumnYMode),
        Promise.resolve(scichart.EResamplingMode),
        Promise.resolve(scichart.parseColorToUIntArgb),
        Promise.resolve(scichart.SciChartJsNavyTheme),
        Promise.resolve(scichart.TextAnnotation),
        Promise.resolve(scichart.ECoordinateMode),
        Promise.resolve(scichart.EVerticalAnchorPoint),
        Promise.resolve(scichart.EHorizontalAnchorPoint),
      ]);

      if (cancelled) return;
      const Surface = SciChartSurface as unknown as { useWasmFromCDN?: () => void | Promise<void> };
      if (typeof Surface.useWasmFromCDN === "function") {
        await Surface.useWasmFromCDN();
      }

      const items = prepareTreemapData(agents);
      const leaves = prepareLayout(items);
      if (leaves.length === 0) return;
      const minP = Math.min(...leaves.map((l) => l.data.progress), 0);
      const maxP = Math.max(...leaves.map((l) => l.data.progress), 0);
      const gray = 0x404040;
      const green = parseColorToUIntArgb("#22C55E");
      const red = parseColorToUIntArgb("#EF4444");

      const { EFillPaletteMode } = await import("scichart");
      const paletteProvider = {
        fillPaletteMode: EFillPaletteMode.SOLID,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by IFillPaletteProvider
        onAttached: (_parentSeries: unknown) => {},
        onDetached: () => {},
        overrideFillArgb: (
          _x: number,
          _y: number,
          _index: number,
          _opacity: number | undefined,
          metadata?: unknown
        ): number => {
          const p = (metadata as TreemapDataItem | undefined)?.progress ?? 0;
          if (p === 0) return gray;
          const t =
            p > 0
              ? Math.min(p / (maxP || 1), 1)
              : Math.min(p / (minP || -1), 1);
          const getC = (c: number) => ({
            r: (c >> 16) & 0xff,
            g: (c >> 8) & 0xff,
            b: c & 0xff,
          });
          const start = p > 0 ? gray : red;
          const end = p > 0 ? green : gray;
          const s = getC(start);
          const e = getC(end);
          const r = Math.round(s.r + (e.r - s.r) * t);
          const g = Math.round(s.g + (e.g - s.g) * t);
          const b = Math.round(s.b + (e.b - s.b) * t);
          return (0xff << 24) | (r << 16) | (g << 8) | b;
        },
      };

      const again = el.getBoundingClientRect();
      if (again.width < 1 || again.height < 1 || cancelled) return;
      el.style.width = `${Math.round(again.width)}px`;
      el.style.height = `${Math.round(again.height)}px`;
      const baseTheme = new SciChartJsNavyTheme();
      const themeOverrides = getSciChartThemeOverrides();
      const { sciChartSurface, wasmContext } = await SciChartSurface.create(el, {
        theme: { ...baseTheme, ...themeOverrides },
      });
      if (cancelled) {
        sciChartSurface.delete();
        return;
      }
      surfaceRef.current = { sciChartSurface, wasmContext };

      const xAxis = new NumericAxis(wasmContext, {
        isVisible: false,
        visibleRange: new NumberRange(0, TREEMAP_WIDTH),
      });
      const yAxis = new NumericAxis(wasmContext, {
        isVisible: false,
        flippedCoordinates: true,
        visibleRange: new NumberRange(0, TREEMAP_HEIGHT),
      });
      sciChartSurface.xAxes.add(xAxis);
      sciChartSurface.yAxes.add(yAxis);

      const rectangleSeries = new FastRectangleRenderableSeries(wasmContext, {
        dataSeries: new XyxyDataSeries(wasmContext, {
          xValues: leaves.map((d) => d.x0),
          yValues: leaves.map((d) => d.y0),
          x1Values: leaves.map((d) => d.x1),
          y1Values: leaves.map((d) => d.y1),
          metadata: leaves.map((d) => ({ ...d.data, isSelected: false })),
        }),
        columnXMode: EColumnMode.StartEnd,
        columnYMode: EColumnYMode.TopBottom,
        strokeThickness: 1,
        stroke: "#55ffffff",
        resamplingMode: EResamplingMode.None,
        paletteProvider,
      });
      sciChartSurface.renderableSeries.add(rectangleSeries);

      for (const leaf of leaves) {
        const cx = (leaf.x0 + leaf.x1) / 2;
        const cy = (leaf.y0 + leaf.y1) / 2;
        const shortName = leaf.data.shortName ?? leaf.data.name.slice(0, 8);
        const pnlStr = formatPnlForTreemap(leaf.data.progress);
        const label = new TextAnnotation({
          x1: cx,
          y1: cy,
          xCoordinateMode: ECoordinateMode.DataValue,
          yCoordinateMode: ECoordinateMode.DataValue,
          horizontalAnchorPoint: EHorizontalAnchorPoint.Center,
          verticalAnchorPoint: EVerticalAnchorPoint.Center,
          text: `${shortName}\n${pnlStr}`,
          textColor: "#ffffff",
          fontSize: 10,
          fontFamily: "system-ui, sans-serif",
        });
        sciChartSurface.annotations.add(label);
      }
      } catch (err) {
        if (!cancelled) {
          setChartError(err instanceof Error ? err.message : "Chart failed to load");
        }
      }
    };

    void init();
    return () => {
      cancelled = true;
      if (surfaceRef.current?.sciChartSurface) {
        surfaceRef.current.sciChartSurface.delete();
        surfaceRef.current = null;
      }
    };
  }, [agents, containerReady]);

  if (agents.length === 0) return null;

  return (
    <section
      className={`relative overflow-hidden rounded ${className}`.trim()}
      aria-label="Top agents treemap by traded volume"
      style={{ minHeight: CHART_HEIGHT_PX, height: CHART_HEIGHT_PX, minWidth: 160 }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: CHART_HEIGHT_PX, minHeight: CHART_HEIGHT_PX }}
      />
      {chartError != null && (
        <div
          className="flex items-center justify-center rounded bg-muted/90 p-3 text-center text-xs text-muted-foreground"
          style={{ marginTop: -CHART_HEIGHT_PX, height: CHART_HEIGHT_PX }}
        >
          {chartError}
        </div>
      )}
    </section>
  );
}
