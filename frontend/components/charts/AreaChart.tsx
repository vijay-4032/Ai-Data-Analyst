"use client";

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn, formatCompact, chartColors } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

// ==========================================
// Types
// ==========================================
interface AreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  secondaryKey?: string;
  color?: string;
  secondaryColor?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  gradient?: boolean;
  type?: "area" | "line";
  curved?: boolean;
  className?: string;
}

// ==========================================
// Custom Tooltip
// ==========================================
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl shadow-lg border",
        isDark
          ? "bg-dark-surface border-white/10"
          : "bg-white border-gray-200"
      )}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
        {label}
      </p>
      {payload.map((entry, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-500 dark:text-gray-400 capitalize">
              {entry.dataKey}
            </span>
          </div>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCompact(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// Main Area Chart Component
// ==========================================
export function AreaChartComponent({
  data,
  xKey,
  yKey,
  secondaryKey,
  color = chartColors.primary,
  secondaryColor = chartColors.accent,
  height = 300,
  showGrid = false,
  showLegend = false,
  gradient = true,
  type = "area",
  curved = true,
  className,
}: AreaChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Axis styling
  const axisStyle = {
    fontSize: 12,
    fill: isDark ? "#9CA3AF" : "#6B7280",
  };

  // Grid styling
  const gridStyle = {
    stroke: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  };

  // Gradient IDs
  const gradientId = `gradient-${yKey}`;
  const secondaryGradientId = `gradient-${secondaryKey}`;

  // Curve type
  const curveType = curved ? "monotone" : "linear";

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        {type === "area" ? (
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
              {secondaryKey && (
                <linearGradient
                  id={secondaryGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={secondaryColor}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={secondaryColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              )}
            </defs>

            {/* Grid */}
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                {...gridStyle}
              />
            )}

            {/* Axes */}
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={axisStyle}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={axisStyle}
              tickFormatter={(value) => formatCompact(value)}
              dx={-10}
            />

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Legend */}
            {showLegend && <Legend />}

            {/* Secondary Area (behind primary) */}
            {secondaryKey && (
              <Area
                type={curveType}
                dataKey={secondaryKey}
                stroke={secondaryColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                fill={gradient ? `url(#${secondaryGradientId})` : secondaryColor}
                fillOpacity={gradient ? 1 : 0.1}
              />
            )}

            {/* Primary Area */}
            <Area
              type={curveType}
              dataKey={yKey}
              stroke={color}
              strokeWidth={3}
              fill={gradient ? `url(#${gradientId})` : color}
              fillOpacity={gradient ? 1 : 0.1}
              dot={false}
              activeDot={{
                r: 6,
                fill: color,
                stroke: isDark ? "#0A0A0F" : "#FFFFFF",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        ) : (
          <LineChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                {...gridStyle}
              />
            )}
            <XAxis
              dataKey={xKey}
              axisLine={false}
              tickLine={false}
              tick={axisStyle}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={axisStyle}
              tickFormatter={(value) => formatCompact(value)}
              dx={-10}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}

            {secondaryKey && (
              <Line
                type={curveType}
                dataKey={secondaryKey}
                stroke={secondaryColor}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
            <Line
              type={curveType}
              dataKey={yKey}
              stroke={color}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: color,
                stroke: isDark ? "#0A0A0F" : "#FFFFFF",
                strokeWidth: 2,
              }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}