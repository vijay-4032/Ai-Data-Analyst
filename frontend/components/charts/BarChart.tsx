"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { cn, formatCompact, chartColors } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

// ==========================================
// Types
// ==========================================
interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  secondaryKey?: string;
  color?: string;
  secondaryColor?: string;
  colors?: string[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  stacked?: boolean;
  gradient?: boolean;
  barSize?: number;
  radius?: number;
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
              className="w-3 h-3 rounded-sm"
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
// Main Bar Chart Component
// ==========================================
export function BarChartComponent({
  data,
  xKey,
  yKey,
  secondaryKey,
  color = chartColors.primary,
  secondaryColor = chartColors.accent,
  colors,
  height = 300,
  showGrid = false,
  showLegend = false,
  horizontal = false,
  stacked = false,
  gradient = true,
  barSize = 40,
  radius = 8,
  className,
}: BarChartProps) {
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

  // Gradient ID
  const gradientId = "barGradient";

  // Use individual colors for each bar if provided
  const useIndividualColors = colors && colors.length > 0;

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={horizontal ? "vertical" : "horizontal"}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          barSize={barSize}
        >
          {/* Gradient Definition */}
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColors.primary} />
              <stop offset="100%" stopColor={chartColors.accent} />
            </linearGradient>
          </defs>

          {/* Grid */}
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={!horizontal}
              vertical={horizontal}
              {...gridStyle}
            />
          )}

          {/* Axes */}
          {horizontal ? (
            <>
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={axisStyle}
                tickFormatter={(value) => formatCompact(value)}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                axisLine={false}
                tickLine={false}
                tick={axisStyle}
                width={80}
              />
            </>
          ) : (
            <>
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
            </>
          )}

          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />

          {/* Legend */}
          {showLegend && <Legend />}

          {/* Primary Bar */}
          <Bar
            dataKey={yKey}
            fill={gradient ? `url(#${gradientId})` : color}
            radius={
              horizontal
                ? [0, radius, radius, 0]
                : [radius, radius, 0, 0]
            }
            stackId={stacked ? "stack" : undefined}
          >
            {/* Individual colors for each bar */}
            {useIndividualColors &&
              data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
          </Bar>

          {/* Secondary Bar */}
          {secondaryKey && (
            <Bar
              dataKey={secondaryKey}
              fill={secondaryColor}
              radius={
                horizontal
                  ? [0, radius, radius, 0]
                  : [radius, radius, 0, 0]
              }
              stackId={stacked ? "stack" : undefined}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// Horizontal Bar Chart Variant
// ==========================================
export function HorizontalBarChart(
  props: Omit<BarChartProps, "horizontal">
) {
  return <BarChartComponent {...props} horizontal />;
}

// ==========================================
// Stacked Bar Chart Variant
// ==========================================
export function StackedBarChart(
  props: Omit<BarChartProps, "stacked">
) {
  return <BarChartComponent {...props} stacked />;
}