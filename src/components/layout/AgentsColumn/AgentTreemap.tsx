"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stratify, treemap } from "d3-hierarchy";
import type { Agent } from "@/types/agent.types";
import { formatCollateral } from "@/lib/formatNumbers";

const PADDING = 1;
const MIN_LABEL_WIDTH = 44;
const MIN_LABEL_HEIGHT = 28;
const MIN_HEIGHT_ROI_PNL = 48;
const MIN_HEIGHT_FULL = 70;
const LINE_HEIGHT = 11;
const USDC_DECIMALS = 6;

/** Agent shape for treemap: strategy group, size value, PnL/ROI for coloring and labels. */
export interface TreemapAgentInput {
  id: string;
  name: string;
  tradingStrategy: string;
  totalVolume: number;
  totalTrades: number;
  pnl: number;
  roi: number;
}

/** Flat node for d3 stratify: id, parent, value; extra for leaves. */
interface TreemapFlatNode {
  id: string;
  parent: string;
  value: number;
  name?: string;
  tradingStrategy?: string;
  totalVolume?: number;
  totalTrades?: number;
  pnl?: number;
  roi?: number;
}

/** Map Agent (API) to TreemapAgentInput. Uses strategy.preference for group, derives ROI from pnl/tradedAmount. */
export function agentsToTreemapInput(agents: Agent[]): TreemapAgentInput[] {
  return agents.map((a) => {
    const pref = a.strategy?.preference;
    const tradingStrategy =
      pref === "AMM_ONLY"
        ? "AMM"
        : pref === "ORDERBOOK"
          ? "Orderbook"
          : pref === "HYBRID"
            ? "Hybrid"
            : "Other";
    const totalVolume = a.tradedAmount ?? 0;
    const totalTrades = a.totalTrades ?? 0;
    const pnl = a.pnl ?? 0;
    const invested = totalVolume || 1;
    const roi = totalVolume ? (pnl / invested) * 100 : 0;
    return {
      id: a.id,
      name: a.name?.trim() || a.id.slice(0, 8),
      tradingStrategy,
      totalVolume,
      totalTrades,
      pnl,
      roi,
    };
  });
}

/** Realistic mock data for immediate render when no agents or for demos. */
export function getMockTreemapAgents(): TreemapAgentInput[] {
  const strategies = ["Momentum", "Arbitrage", "Value"] as const;
  const names = [
    "Alpha Runner",
    "Beta Scout",
    "Gamma Hedge",
    "Delta Flow",
    "Echo Signal",
    "Sigma Mean",
    "Theta Vol",
    "Omega Macro",
  ];
  const out: TreemapAgentInput[] = [];
  let i = 0;
  for (const strategy of strategies) {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let j = 0; j < count; j++) {
      const totalVolume = Math.round((50 + Math.random() * 200) * 10 ** USDC_DECIMALS);
      const totalTrades = Math.round(20 + Math.random() * 80);
      const roi = Number(((-12 + Math.random() * 28).toFixed(2)));
      const pnl = Math.round((roi / 100) * (totalVolume / 10 ** USDC_DECIMALS) * 10 ** USDC_DECIMALS);
      out.push({
        id: `mock-${strategy}-${i}`,
        name: names[i % names.length],
        tradingStrategy: strategy,
        totalVolume,
        totalTrades,
        pnl,
        roi,
      });
      i++;
    }
  }
  return out;
}

function buildHierarchy(items: TreemapAgentInput[]): TreemapFlatNode[] {
  const root: TreemapFlatNode = { id: "root", parent: "", value: 0 };
  const nodes: TreemapFlatNode[] = [root];
  const strategySums: Record<string, number> = {};

  for (const a of items) {
    const value = Math.max(0.01, a.totalVolume || a.totalTrades || 1);
    strategySums[a.tradingStrategy] = (strategySums[a.tradingStrategy] ?? 0) + value;
  }

  for (const key of Object.keys(strategySums)) {
    nodes.push({
      id: `strategy-${key}`,
      parent: "root",
      value: strategySums[key],
    });
  }

  for (const a of items) {
    const value = Math.max(0.01, a.totalVolume || a.totalTrades || 1);
    nodes.push({
      id: a.id,
      parent: `strategy-${a.tradingStrategy}`,
      value,
      name: a.name,
      tradingStrategy: a.tradingStrategy,
      totalVolume: a.totalVolume,
      totalTrades: a.totalTrades,
      pnl: a.pnl,
      roi: a.roi,
    });
  }

  return nodes;
}

type LayoutNode = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
  data: TreemapFlatNode;
  depth: number;
  isLeaf: boolean;
};

function computeLayout(
  data: TreemapFlatNode[],
  width: number,
  height: number
): LayoutNode[] {
  const root = stratify<TreemapFlatNode>()
    .id((d) => d.id)
    .parentId((d) => (d.parent === "" ? null : d.parent))(data);
  root.sum((d) => Number(d.value));
  treemap<TreemapFlatNode>()
    .size([width, height])
    .padding(PADDING)
    .round(true)(root);
  const descendants = root.descendants() as unknown as Array<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    data: TreemapFlatNode;
    depth: number;
  }>;
  return descendants.map((n) => ({
    x0: n.x0,
    y0: n.y0,
    x1: n.x1,
    y1: n.y1,
    width: n.x1 - n.x0,
    height: n.y1 - n.y0,
    data: n.data,
    depth: n.depth,
    isLeaf: n.data.name !== undefined && (n.data.roi !== undefined || n.data.pnl !== undefined),
  }));
}

/** ROI to CSS color: red (negative), gray (zero), green (positive). */
function getRoiColor(roi: number): string {
  if (roi === 0 || Number.isNaN(roi)) return "rgb(113 113 122)"; // muted gray
  if (roi > 0) {
    const t = Math.min(1, roi / 20);
    const g = 140 + Math.round(115 * t);
    const r = 34;
    const b = 94;
    return `rgb(${r} ${g} ${b})`;
  }
  const t = Math.min(1, -roi / 20);
  const r = 239;
  const g = 220 - Math.round(176 * t);
  const b = 220 - Math.round(176 * t);
  return `rgb(${r} ${g} ${b})`;
}

function formatVolume(units: number): string {
  const normalized = Number(units) / 10 ** USDC_DECIMALS;
  return formatCollateral(String(normalized));
}

function formatRoi(roi: number): string {
  if (roi === 0 || Number.isNaN(roi)) return "0%";
  const sign = roi > 0 ? "+" : "";
  return `${sign}${Number(roi).toFixed(2)}%`;
}

function formatPnl(units: number): string {
  const n = Number(units) / 10 ** USDC_DECIMALS;
  if (n === 0 || Number.isNaN(n)) return "$0";
  const sign = n > 0 ? "+" : "";
  return `${sign}${formatCollateral(String(n))}`;
}

export interface AgentTreemapProps {
  agents: Agent[];
  className?: string;
  /** When true, render simple bar strip only (no hierarchy). Use when WASM or layout may fail. */
  simpleOnly?: boolean;
  /** When true and agents.length === 0, show mock data so treemap renders immediately. */
  useMockWhenEmpty?: boolean;
}

function SimpleTreemapFallback({
  agents,
  className = "",
}: {
  agents: Agent[];
  className?: string;
}) {
  const total = agents.reduce(
    (sum, a) =>
      sum + Math.max(0.01, (a.tradedAmount ?? 0) + (a.balance ?? 0) || 1),
    0
  );
  if (total <= 0) return null;
  return (
    <section
      className={`flex w-full min-w-0 flex-nowrap gap-0.5 overflow-x-auto overflow-y-hidden rounded border border-border ${className}`.trim()}
      style={{ minHeight: 200 }}
      aria-label="Agents by volume"
    >
      {agents.map((a) => {
        const value = Math.max(
          0.01,
          (a.tradedAmount ?? 0) + (a.balance ?? 0) || 1
        );
        const pct = Math.max(2, (value / total) * 100);
        const pnl = typeof a.pnl === "number" ? a.pnl : 0;
        const bg =
          pnl > 0 ? "bg-success/80" : pnl < 0 ? "bg-danger/60" : "bg-muted";
        return (
          <div
            key={a.id}
            className={`flex min-w-0 items-center justify-center rounded p-1 text-center ${bg} text-white`}
            style={{
              flex: `${pct} 1 0`,
              minWidth: "2.5rem",
              fontSize: 10,
            }}
            title={`${a.name ?? a.id} | Vol: ${value.toFixed(0)} | PnL: ${pnl}`}
          >
            <span className="truncate">
              {a.name?.slice(0, 8) ?? a.id.slice(0, 8)}
            </span>
          </div>
        );
      })}
    </section>
  );
}

/** Custom tooltip for a treemap node. */
function NodeTooltip({
  name,
  strategy,
  totalVolume,
  totalTrades,
  pnl,
  roi,
  x,
  y,
}: {
  name: string;
  strategy: string;
  totalVolume: number;
  totalTrades: number;
  pnl: number;
  roi: number;
  x: number;
  y: number;
}) {
  const roiColor = roi > 0 ? "text-green-600" : roi < 0 ? "text-red-600" : "text-muted-foreground";
  const pnlColor = pnl > 0 ? "text-green-600" : pnl < 0 ? "text-red-600" : "text-muted-foreground";
  return (
    <div
      className="pointer-events-none absolute z-10 rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-lg"
      style={{ left: x, top: y, transform: "translate(8px, 8px)" }}
      role="tooltip"
    >
      <p className="font-semibold text-foreground">{name}</p>
      <p className="mt-0.5 text-muted-foreground">Strategy: {strategy}</p>
      <p className={`mt-0.5 font-medium ${roiColor}`}>ROI: {formatRoi(roi)}</p>
      <p className={`mt-0.5 font-medium ${pnlColor}`}>PnL: {formatPnl(pnl)}</p>
      <p className="mt-0.5 text-muted-foreground">
        Volume: {formatVolume(totalVolume)}
      </p>
      <p className="mt-0.5 text-muted-foreground">
        Trades: {totalTrades}
      </p>
    </div>
  );
}

export function AgentTreemap({
  agents,
  className = "",
  simpleOnly = false,
  useMockWhenEmpty = false,
}: AgentTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height: 200 });
  const [hoverNode, setHoverNode] = useState<{
    name: string;
    strategy: string;
    totalVolume: number;
    totalTrades: number;
    pnl: number;
    roi: number;
    x: number;
    y: number;
  } | null>(null);

  const items: TreemapAgentInput[] = useCallback(() => {
    if (agents.length > 0) return agentsToTreemapInput(agents);
    if (useMockWhenEmpty) return getMockTreemapAgents();
    return [];
  }, [agents, useMockWhenEmpty])();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      setSize((prev) =>
        prev.width === w && prev.height === h ? prev : { width: w, height: h }
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (simpleOnly) {
    return (
      <SimpleTreemapFallback agents={agents} className={className} />
    );
  }

  if (items.length === 0) {
    return null;
  }

  const flat = buildHierarchy(items);
  const nodes = computeLayout(flat, size.width, size.height);
  const strokeColor = "rgb(var(--background))";

  return (
    <article
      className={`overflow-hidden rounded-lg border border-border bg-background ${className}`.trim()}
      aria-label="Agents treemap by strategy and volume"
    >
      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: 200, height: 200 }}
      >
        <svg
          width={size.width}
          height={size.height}
          className="block h-full w-full"
          aria-hidden
        >
          <g>
            {nodes.map((node) => {
              const roi = node.data.roi ?? 0;
              const fill = node.isLeaf
                ? getRoiColor(roi)
                : "rgb(63 63 70)";
              const showLabel =
                node.isLeaf &&
                node.width >= MIN_LABEL_WIDTH &&
                node.height >= MIN_LABEL_HEIGHT;
              return (
                <g key={node.data.id}>
                  <rect
                    x={node.x0}
                    y={node.y0}
                    width={node.width}
                    height={node.height}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth={1}
                    onMouseEnter={() => {
                      if (node.isLeaf && node.data.name != null) {
                        setHoverNode({
                          name: node.data.name,
                          strategy: node.data.tradingStrategy ?? "",
                          totalVolume: node.data.totalVolume ?? 0,
                          totalTrades: node.data.totalTrades ?? 0,
                          pnl: node.data.pnl ?? 0,
                          roi: node.data.roi ?? 0,
                          x: node.x0 + node.width / 2,
                          y: node.y0 + node.height / 2,
                        });
                      }
                    }}
                    onMouseLeave={() => setHoverNode(null)}
                  />
                  {showLabel && (() => {
                    const cx = node.x0 + node.width / 2;
                    const nameStr = node.data.name?.slice(0, 14) ?? node.data.id.slice(0, 8);
                    const roiStr = formatRoi(node.data.roi ?? 0);
                    const pnlStr = formatPnl(node.data.pnl ?? 0);
                    const showRoiPnl = node.height >= MIN_HEIGHT_ROI_PNL;
                    const showFull = node.height >= MIN_HEIGHT_FULL;
                    const roiColor = (node.data.roi ?? 0) > 0 ? "#22c55e" : (node.data.roi ?? 0) < 0 ? "#ef4444" : "#a1a1aa";
                    const pnlColor = (node.data.pnl ?? 0) > 0 ? "#22c55e" : (node.data.pnl ?? 0) < 0 ? "#ef4444" : "#a1a1aa";
                    let dy = node.y0 + node.height / 2;
                    if (showFull) dy -= LINE_HEIGHT * 1.5;
                    else if (showRoiPnl) dy -= LINE_HEIGHT * 0.5;
                    return (
                      <g className="pointer-events-none select-none">
                        <text
                          x={cx}
                          y={dy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={10}
                          fontWeight={600}
                        >
                          {nameStr}
                        </text>
                        {showRoiPnl && (
                          <>
                            <text
                              x={cx}
                              y={dy + LINE_HEIGHT}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={roiColor}
                              fontSize={9}
                              fontWeight={500}
                            >
                              ROI {roiStr}
                            </text>
                            <text
                              x={cx}
                              y={dy + LINE_HEIGHT * 2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill={pnlColor}
                              fontSize={9}
                              fontWeight={500}
                            >
                              PnL {pnlStr}
                            </text>
                          </>
                        )}
                        {showFull && (
                          <text
                            x={cx}
                            y={dy + LINE_HEIGHT * 3}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="rgba(255,255,255,0.9)"
                            fontSize={8}
                          >
                            Vol {formatVolume(node.data.totalVolume ?? 0)} · {node.data.totalTrades ?? 0} trades
                          </text>
                        )}
                      </g>
                    );
                  })()}
                </g>
              );
            })}
          </g>
        </svg>
        {hoverNode && (
          <NodeTooltip
            name={hoverNode.name}
            strategy={hoverNode.strategy}
            totalVolume={hoverNode.totalVolume}
            totalTrades={hoverNode.totalTrades}
            pnl={hoverNode.pnl}
            roi={hoverNode.roi}
            x={hoverNode.x}
            y={hoverNode.y}
          />
        )}
      </div>
    </article>
  );
}
