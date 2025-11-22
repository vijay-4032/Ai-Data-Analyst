"use client";

import {
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Hash,
  Percent,
  BarChart3,
  Brain,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, formatCompact } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { KPIMetric } from "@/types";

// ==========================================
// Icon Mapping
// ==========================================
const iconMap: Record<string, React.ElementType> = {
  revenue: DollarSign,
  transactions: ShoppingCart,
  users: Users,
  default: BarChart3,
  ai: Brain,
};

// ==========================================
// Format Value Based on Type
// ==========================================
function formatValue(
  value: number | string,
  format: KPIMetric["format"]
): string {
  if (typeof value === "string") return value;

  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "compact":
      return formatCompact(value);
    case "number":
    default:
      return formatNumber(value);
  }
}

// ==========================================
// Trend Icon Component
// ==========================================
function TrendIcon({ trend }: { trend: KPIMetric["trend"] }) {
  switch (trend) {
    case "up":
      return <TrendingUp className="w-4 h-4" />;
    case "down":
      return <TrendingDown className="w-4 h-4" />;
    default:
      return <Minus className="w-4 h-4" />;
  }
}

// ==========================================
// Single KPI Card Component
// ==========================================
interface KPICardProps {
  kpi: KPIMetric;
  className?: string;
}

export function KPICard({ kpi, className }: KPICardProps) {
  const {
    label,
    value,
    format = "number",
    change,
    changeLabel,
    trend = "stable",
    icon,
  } = kpi;

  // Determine trend from change if not provided
  const determinedTrend =
    trend || (change && change > 0 ? "up" : change && change < 0 ? "down" : "stable");

  // Get icon component
  const IconComponent =
    iconMap[icon || "default"] || iconMap.default;

  // Trend colors
  const trendColors = {
    up: "text-emerald-500 bg-emerald-500/10",
    down: "text-red-500 bg-red-500/10",
    stable: "text-gray-500 bg-gray-500/10",
  };

  return (
    <Card
      className={cn("group relative overflow-hidden", className)}
      interactive
    >
      {/* Background gradient on hover */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100",
          "bg-gradient-to-br from-primary/5 to-accent/5",
          "transition-opacity duration-300"
        )}
      />

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {label}
          </span>
          <div
            className={cn(
              "p-2 rounded-lg",
              "bg-primary/10 text-primary",
              "group-hover:scale-110 transition-transform"
            )}
          >
            <IconComponent className="w-4 h-4" />
          </div>
        </div>

        {/* Value */}
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {formatValue(value, format)}
        </div>

        {/* Change */}
        {(change !== undefined || changeLabel) && (
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium",
              trendColors[determinedTrend]
            )}
          >
            <TrendIcon trend={determinedTrend} />
            {change !== undefined && (
              <span>
                {change > 0 ? "+" : ""}
                {change.toFixed(1)}%
              </span>
            )}
            {changeLabel && (
              <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                {changeLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// ==========================================
// KPI Grid Component
// ==========================================
interface KPIGridProps {
  kpis: KPIMetric[];
  className?: string;
  columns?: 2 | 3 | 4;
}

export function KPIGrid({ kpis, className, columns = 4 }: KPIGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {kpis.map((kpi) => (
        <KPICard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

// ==========================================
// Loading Skeleton
// ==========================================
export function KPICardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-lg" />
      </div>
      <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded mb-2" />
      <div className="h-6 w-20 bg-gray-200 dark:bg-white/10 rounded" />
    </Card>
  );
}

export function KPIGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <KPICardSkeleton key={i} />
      ))}
    </div>
  );
}