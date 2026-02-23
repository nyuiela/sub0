"use client";

import type { Agent } from "@/types/agent.types";
import type { AgentTrack } from "@/types/agent.types";

export interface VitalsHeaderProps {
  agent: Agent;
  /** Last N track points for 24h-style sparkline (e.g. last 7 days). */
  sparklineData?: AgentTrack[];
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

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const coords = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - ((p - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}

export function VitalsHeader({
  agent,
  sparklineData = [],
  className = "",
}: VitalsHeaderProps) {
  const pnl = agent.pnl ?? 0;
  const winRate = agent.winRate ?? 0;
  const exposure = agent.currentExposure ?? 0;
  const drawdown = agent.maxDrawdown ?? 0;

  const sparklinePoints = sparklineData
    .slice(-7)
    .map((t) => parseNum(t.pnl));
  if (sparklinePoints.length < 2 && agent.pnl != null) {
    sparklinePoints.push(pnl);
  }

  const winRatePct = Math.round(winRate * 100);
  const size = 48;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (winRatePct / 100) * circumference;

  return (
    <header
      className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${className}`.trim()}
      aria-label="Performance and risk vitals"
    >
      <section
        className="rounded-lg border border-border bg-surface p-3"
        aria-label="Profit and loss"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          PnL
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`text-lg font-semibold ${
              pnl >= 0 ? "text-success" : "text-danger"
            }`}
          >
            {pnl >= 0 ? "+" : ""}
            {Number(pnl).toFixed(2)}
          </span>
          <Sparkline points={sparklinePoints} />
        </div>
        <p className="mt-0.5 text-xs text-muted">24h trend</p>
      </section>

      <section
        className="rounded-lg border border-border bg-surface p-3"
        aria-label="Win rate"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Win Rate
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <svg width={size} height={size} className="shrink-0" aria-hidden>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              className="text-muted/40"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke="currentColor"
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="text-primary transition-[stroke-dashoffset] duration-300"
            />
          </svg>
          <span className="text-lg font-semibold text-foreground">
            {winRatePct}%
          </span>
        </div>
      </section>

      <section
        className="rounded-lg border border-border bg-surface p-3"
        aria-label="Current exposure"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Current Exposure
        </h3>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {Number(exposure).toFixed(2)}
        </p>
        <p className="mt-0.5 text-xs text-muted">Capital at risk</p>
      </section>

      <section
        className="rounded-lg border border-border bg-surface p-3"
        aria-label="Max drawdown"
      >
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
          Max Drawdown
        </h3>
        <p className="mt-1 text-lg font-semibold text-danger">
          {Number(drawdown).toFixed(2)}
        </p>
        <p className="mt-0.5 text-xs text-muted">Peak-to-trough</p>
      </section>
    </header>
  );
}
