"use client";

import { useMemo, useState } from "react";
import {
  Area,
  Bar,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AgentTrack } from "@/types/agent.types";

export type TimeframeKey = "7D" | "30D" | "ALL";

export interface PerformanceChartProps {
  tracks: AgentTrack[];
  className?: string;
}

function parseNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function PerformanceChart({ tracks, className = "" }: PerformanceChartProps) {
  const [timeframe, setTimeframe] = useState<TimeframeKey>("30D");

  const { series, leftMax, rightMax } = useMemo(() => {
    const sorted = [...tracks].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const now = Date.now();
    const cutoffs: Record<TimeframeKey, number> = {
      "7D": 7 * 24 * 60 * 60 * 1000,
      "30D": 30 * 24 * 60 * 60 * 1000,
      ALL: Infinity,
    };
    const cutoff = cutoffs[timeframe];
    const filtered =
      timeframe === "ALL"
        ? sorted
        : sorted.filter((t) => now - new Date(t.date).getTime() <= cutoff);

    let cumPnl = 0;
    let cumCost = 0;
    const data = filtered.map((t) => {
      cumPnl += parseNum(t.pnl);
      cumCost += parseNum(t.llmCost);
      return {
        date: t.date,
        label: formatDateLabel(t.date),
        cumulativePnl: cumPnl,
        cumulativeLlmCost: cumCost,
        llmTokens: t.llmTokensUsed ?? 0,
      };
    });

    const pnls = data.map((d) => d.cumulativePnl);
    const costs = data.map((d) => d.cumulativeLlmCost);
    const leftMax =
      pnls.length > 0
        ? Math.max(1, Math.abs(Math.min(...pnls)), Math.max(...pnls))
        : 1;
    const rightMax =
      costs.length > 0 ? Math.max(0.01, Math.max(...costs)) : 0.01;

    return { series: data, leftMax, rightMax };
  }, [tracks, timeframe]);

  return (
    <section
      className={`flex flex-col rounded-lg border border-border bg-surface p-3 ${className}`.trim()}
      aria-label="Return on compute chart"
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          PnL vs LLM Cost
        </h3>
        <nav
          role="tablist"
          aria-label="Timeframe"
          className="flex rounded-md border border-border bg-muted/30 p-0.5"
        >
          {(["7D", "30D", "ALL"] as const).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={timeframe === key}
              onClick={() => setTimeframe(key)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                timeframe === key
                  ? "bg-surface text-foreground shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {key}
            </button>
          ))}
        </nav>
      </div>
      <div className="h-[240px] w-full">
        {series.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            No track data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={series}
              margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "var(--color-border)" }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                domain={[-leftMax, leftMax]}
                tickFormatter={(v) => (v >= 0 ? `+${v}` : String(v))}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                domain={[0, rightMax]}
                tickFormatter={(v) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                }}
                labelFormatter={(_, payload) =>
                  payload?.[0]?.payload?.date ?? ""
                }
                formatter={(value: number, name: string) => {
                  if (name === "Cumulative PnL") return [value.toFixed(2), "PnL"];
                  if (name === "LLM Cost") return [`$${value.toFixed(4)}`, "Cost"];
                  return [value, name];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px" }}
                formatter={(value) =>
                  value === "cumulativePnl" ? "Cumulative PnL" : "LLM Cost"
                }
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="cumulativePnl"
                name="cumulativePnl"
                fill="var(--color-primary-muted)"
                stroke="var(--color-primary)"
                strokeWidth={2}
              />
              <Bar
                yAxisId="right"
                dataKey="cumulativeLlmCost"
                name="cumulativeLlmCost"
                fill="var(--color-text-muted)"
                radius={[4, 4, 0, 0]}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
