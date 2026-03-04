"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { TrendingUp, Activity } from "lucide-react";

export interface ProbabilityDataPoint {
  timestamp: number;
  probability: number;
}

export interface SimulateProbabilityChartProps {
  /** Array of probability data points */
  data?: ProbabilityDataPoint[];
  /** Title for the chart */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Color theme - matches your existing surface/foreground */
  className?: string;
  /** Height of the chart container */
  height?: number;
  /** Enable live simulation mode with random data updates */
  simulateLive?: boolean;
  /** Interval in ms for live simulation updates (default: 2000ms) */
  simulationInterval?: number;
  /** Current market name or label */
  marketName?: string;
}

interface ChartDataPoint extends ProbabilityDataPoint {
  formattedTime: string;
  percentage: string;
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function generateMockData(count: number = 50): ProbabilityDataPoint[] {
  const now = Date.now();
  const data: ProbabilityDataPoint[] = [];
  let currentProb = 0.5;

  for (let i = count; i >= 0; i--) {
    // Add some random walk to simulate realistic probability movement
    const change = (Math.random() - 0.5) * 0.05;
    currentProb = Math.max(0.05, Math.min(0.95, currentProb + change));

    data.push({
      timestamp: now - i * 2000,
      probability: currentProb,
    });
  }

  return data;
}

export function SimulateProbabilityChart({
  data: initialData,
  title = "Implied Probability",
  subtitle = "Live backtest simulation",
  className = "",
  height = 280,
  simulateLive = false,
  simulationInterval = 2000,
  marketName,
}: SimulateProbabilityChartProps) {
  const [data, setData] = useState<ProbabilityDataPoint[]>(
    initialData || generateMockData()
  );
  const [isSimulating, setIsSimulating] = useState(simulateLive);

  // Live simulation effect
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setData((prevData) => {
        const lastPoint = prevData[prevData.length - 1];
        const lastProb = lastPoint?.probability ?? 0.5;

        // Random walk with momentum
        const momentum = (Math.random() - 0.5) * 0.02;
        const noise = (Math.random() - 0.5) * 0.03;
        const change = momentum + noise;

        const newProb = Math.max(0.05, Math.min(0.95, lastProb + change));

        const newPoint: ProbabilityDataPoint = {
          timestamp: Date.now(),
          probability: newProb,
        };

        // Keep last 100 points to maintain performance
        const newData = [...prevData.slice(-99), newPoint];
        return newData;
      });
    }, simulationInterval);

    return () => clearInterval(interval);
  }, [isSimulating, simulationInterval]);

  // Transform data for chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    return data.map((point) => ({
      ...point,
      formattedTime: formatTime(point.timestamp),
      percentage: formatPercentage(point.probability),
    }));
  }, [data]);

  const currentProbability = data[data.length - 1]?.probability ?? 0.5;

  // Get platform theme colors from CSS variables
  const getCssVariable = (name: string): string => {
    if (typeof window === "undefined") return "";
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || "";
  };

  const primaryColor = getCssVariable("--color-primary") || "hsl(210, 100%, 50%)";
  const surfaceColor = getCssVariable("--color-surface") || "#ffffff";
  const foregroundColor = getCssVariable("--color-foreground") || "#000000";
  const mutedForegroundColor = getCssVariable("--color-muted-foreground") || "#6b7280";
  const borderColor = getCssVariable("--color-border") || "#e5e7eb";
  const successColor = getCssVariable("--color-success") || "hsl(142, 76%, 36%)";
  const dangerColor = getCssVariable("--color-danger") || "hsl(0, 84%, 60%)";

  const probabilityColor = currentProbability > 0.5 ? successColor : dangerColor;

  return (
    <div
      className={`rounded-lg bg-surface ${className}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* <div>
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {marketName && (
              <p className="text-xs text-muted-foreground">{marketName}</p>
            )}
          </div> */}
        </div>
        <div className="flex items-center gap-2">
          {isSimulating && (
            <div className="flex items-center gap-1 text-xs text-success">
              {/* <Activity className="h-3 w-3 animate-pulse" /> */}
              <span>Live</span>
            </div>
          )}
          <div className="text-right">
            <span
              className="text-2xl font-bold"
              style={{ color: probabilityColor }}
            >
              {formatPercentage(currentProbability)}
            </span>
          </div>
        </div>
      </div>

      {/* Toggle simulation button */}
      {/* <button
        type="button"
        onClick={() => setIsSimulating((prev) => !prev)}
        className="mb-3 rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
      >
        {isSimulating ? "Pause Simulation" : "Start Live Simulation"}
      </button> */}

      {/* Subtitle */}
      {/* <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p> */}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="probabilityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={probabilityColor}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={probabilityColor}
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke={borderColor}
            opacity={0.5}
          />

          <XAxis
            dataKey="formattedTime"
            tick={{ fontSize: 10, fill: mutedForegroundColor }}
            tickLine={false}
            axisLine={{ stroke: borderColor }}
            minTickGap={30}
          />

          <YAxis
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            tick={{ fontSize: 10, fill: mutedForegroundColor }}
            tickLine={false}
            axisLine={{ stroke: borderColor }}
            width={40}
          />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;

              const data = payload[0]?.payload as ChartDataPoint;
              if (!data) return null;

              return (
                <div className="rounded-md border border-border bg-surface p-2 shadow-lg">
                  <p className="text-xs text-muted-foreground mb-1">{label}</p>
                  <p className="text-sm font-semibold" style={{ color: foregroundColor }}>
                    Probability: {data.percentage}
                  </p>
                </div>
              );
            }}
          />

          {/* 50% Reference Line */}
          <ReferenceLine
            y={0.5}
            stroke={mutedForegroundColor}
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />

          <Area
            type="monotone"
            dataKey="probability"
            stroke={probabilityColor}
            strokeWidth={2}
            fill={`url(#probabilityGradient)`}
            dot={false}
            activeDot={{
              r: 4,
              stroke: surfaceColor,
              strokeWidth: 2,
              fill: probabilityColor,
            }}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend / Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>Probability</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-0.5 w-4 border-t border-dashed border-muted-foreground" />
            <span>50% baseline</span>
          </div>
        </div>
        <span>{data.length} data points</span>
      </div>
    </div>
  );
}
