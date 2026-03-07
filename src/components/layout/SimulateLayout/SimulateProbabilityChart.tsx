"use client";

import { useMemo } from "react";
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

export interface ProbabilityDataPoint {
  timestamp: number;
  probability: number;
}

export interface SimulateProbabilityChartProps {
  /** Array of data points (timestamp, probability). Empty = placeholder. */
  data?: ProbabilityDataPoint[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  marketName?: string;
  /** Custom message when chart has no data. */
  emptyMessage?: string;
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

export function SimulateProbabilityChart({
  data: propData,
  title = "Implied Probability",
  subtitle = "Live backtest simulation",
  className = "",
  height = 280,
  marketName,
}: SimulateProbabilityChartProps) {
  const data = useMemo(
    () => (Array.isArray(propData) ? propData : []),
    [propData]
  );

  const chartData: ChartDataPoint[] = useMemo(() => {
    const points = data.length > 0 ? data : [{ timestamp: Date.now(), probability: 0.5 }];
    return points.map((point) => ({
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
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
          {marketName != null && marketName !== "" && (
            <p className="text-xs text-muted-foreground">{marketName}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-success">
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

      {/* Chart - always visible, updates when data arrives */}
      <div>
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

                  const point = payload[0]?.payload as ChartDataPoint;
                  if (!point) return null;

                  return (
                    <div className="rounded-md border border-border bg-surface p-2 shadow-lg">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm font-semibold" style={{ color: foregroundColor }}>
                        Probability: {point.percentage}
                      </p>
                    </div>
                  );
                }}
              />

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
                fill="url(#probabilityGradient)"
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
      </div>

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
