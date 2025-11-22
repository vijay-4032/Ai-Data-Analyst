"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Sector,
} from "recharts";
import { cn, chartColors } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";

// ==========================================
// Types
// ==========================================
interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieChartDataItem[];
  colors?: string[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  donut?: boolean;
  activeAnimation?: boolean;
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
    payload: PieChartDataItem;
  }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  if (!active || !payload?.length) return null;

  const data = payload[0];
  const total = payload[0].payload.value;

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl shadow-lg border",
        isDark
          ? "bg-dark-surface border-white/10"
          : "bg-white border-gray-200"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: data.payload.color }}
        />
        <span className="font-medium text-gray-900 dark:text-white">
          {data.name}
        </span>
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {data.value}%
      </div>
    </div>
  );
}

// ==========================================
// Active Shape (for hover animation)
// ==========================================
interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
  payload: PieChartDataItem;
  percent: number;
}

function ActiveShape(props: any) {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props as ActiveShapeProps;

  return (
    <g>
      {/* Main sector - slightly larger */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        style={{
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))",
        }}
      />
      {/* Inner arc for donut */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={innerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
}

// ==========================================
// Custom Legend
// ==========================================
interface LegendProps {
  data: PieChartDataItem[];
  colors: string[];
}

function CustomLegend({ data, colors }: LegendProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col gap-3 ml-4">
      {data.map((item, index) => {
        const percentage = ((item.value / total) * 100).toFixed(1);
        return (
          <div key={item.name} className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color || colors[index % colors.length] }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {item.name}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// Main Pie Chart Component
// ==========================================
export function PieChartComponent({
  data,
  colors = chartColors.palette,
  height = 300,
  innerRadius = 60,
  outerRadius = 90,
  showLegend = true,
  showLabels = false,
  donut = true,
  activeAnimation = true,
  className,
}: PieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Add colors to data
  const coloredData = data.map((item, index) => ({
    ...item,
    color: item.color || colors[index % colors.length],
  }));

  // Handle mouse events
  const onPieEnter = (_: unknown, index: number) => {
    if (activeAnimation) {
      setActiveIndex(index);
    }
  };

  const onPieLeave = () => {
    setActiveIndex(undefined);
  };

  return (
    <div className={cn("w-full flex items-center", className)}>
      {/* Chart */}
      <div className={showLegend ? "w-1/2" : "w-full"}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius={donut ? innerRadius : 0}
              outerRadius={outerRadius}
              paddingAngle={donut ? 4 : 0}
              dataKey="value"
              nameKey="name"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              activeIndex={activeIndex}
              activeShape={activeAnimation ? ActiveShape : undefined}
            >
              {coloredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={isDark ? "#0A0A0F" : "#FFFFFF"}
                  strokeWidth={2}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                />
              ))}
            </Pie>

            {/* Tooltip */}
            <Tooltip content={<CustomTooltip />} />

            {/* Labels */}
            {showLabels && (
              <Pie
                data={coloredData}
                cx="50%"
                cy="50%"
                innerRadius={outerRadius + 15}
                outerRadius={outerRadius + 15}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="w-1/2">
          <CustomLegend data={coloredData} colors={colors} />
        </div>
      )}
    </div>
  );
}

// ==========================================
// Donut Chart Variant
// ==========================================
export function DonutChart(props: Omit<PieChartProps, "donut">) {
  return <PieChartComponent {...props} donut />;
}

// ==========================================
// Simple Pie Chart Variant (no donut)
// ==========================================
export function SimplePieChart(props: Omit<PieChartProps, "donut">) {
  return <PieChartComponent {...props} donut={false} />;
}