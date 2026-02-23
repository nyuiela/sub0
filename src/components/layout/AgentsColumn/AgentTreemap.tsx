"use client";

import { useEffect, useRef } from "react";
import { stratify, treemap } from "d3-hierarchy";
import type { Agent } from "@/types/agent.types";

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

  useEffect(() => {
    if (!containerRef.current || agents.length === 0) return;
    const el = containerRef.current;
    let cancelled = false;

    const init = async () => {
      const [
        SciChartSurface,
        NumericAxis,
        FastRectangleRenderableSeries,
        XyxyDataSeries,
        EColumnMode,
        EColumnYMode,
        EResamplingMode,
        parseColorToUIntArgb,
        SciChartJsNavyTheme,
      ] = await Promise.all([
        import("scichart").then((m) => m.SciChartSurface),
        import("scichart").then((m) => m.NumericAxis),
        import("scichart").then((m) => m.FastRectangleRenderableSeries),
        import("scichart").then((m) => m.XyxyDataSeries),
        import("scichart").then((m) => m.EColumnMode),
        import("scichart").then((m) => m.EColumnYMode),
        import("scichart").then((m) => m.EResamplingMode),
        import("scichart").then((m) => m.parseColorToUIntArgb),
        import("scichart").then((m) => m.SciChartJsNavyTheme),
      ]);

      if (cancelled) return;
      // useWasmFromCDN is a method, not a React hook
      await (SciChartSurface as { useWasmFromCDN: () => Promise<void> }).useWasmFromCDN();

      const items = prepareTreemapData(agents);
      const leaves = prepareLayout(items);
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
          metadata?: IPointMetadata
        ): number => {
          const p = (metadata as unknown as TreemapDataItem)?.progress ?? 0;
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
      } as IFillPaletteProvider;

      const { sciChartSurface, wasmContext } = await SciChartSurface.create(el, {
        theme: new SciChartJsNavyTheme(),
      });
      if (cancelled) {
        sciChartSurface.delete();
        return;
      }
      surfaceRef.current = { sciChartSurface, wasmContext };

      const xAxis = new NumericAxis(wasmContext, { isVisible: false });
      const yAxis = new NumericAxis(wasmContext, {
        isVisible: false,
        flippedCoordinates: true,
      });
      sciChartSurface.xAxes.add(xAxis);
      sciChartSurface.yAxes.add(yAxis);

      const rectangleSeries = new FastRectangleRenderableSeries(wasmContext, {
        dataSeries: new XyxyDataSeries(wasmContext, {
          xValues: leaves.map((d) => d.x0),
          yValues: leaves.map((d) => d.y0),
          x1Values: leaves.map((d) => d.x1),
          y1Values: leaves.map((d) => d.y1),
          metadata: leaves.map((d) => d.data),
        }),
        columnXMode: EColumnMode.StartEnd,
        columnYMode: EColumnYMode.TopBottom,
        strokeThickness: 1,
        stroke: 0x55ffffff,
        resamplingMode: EResamplingMode.None,
        paletteProvider,
      });
      sciChartSurface.renderableSeries.add(rectangleSeries);
    };

    void init();
    return () => {
      cancelled = true;
      if (surfaceRef.current?.sciChartSurface) {
        surfaceRef.current.sciChartSurface.delete();
        surfaceRef.current = null;
      }
    };
  }, [agents]);

  if (agents.length === 0) return null;

  return (
    <section
      className={`overflow-hidden rounded ${className}`.trim()}
      aria-label="Top agents treemap by traded volume"
      style={{ minHeight: CHART_HEIGHT_PX, height: CHART_HEIGHT_PX }}
    >
      <div
        ref={containerRef}
        style={{ width: "100%", height: CHART_HEIGHT_PX, minHeight: CHART_HEIGHT_PX }}
      />
    </section>
  );
}
