"use client";

import {
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Insight, InsightType } from "@/types";

// ==========================================
// Sample Insights (Replace with real data)
// ==========================================
const sampleInsights: Insight[] = [
  {
    id: "1",
    type: "trend",
    title: "Revenue Growth Accelerating",
    description:
      "Revenue has grown 23.5% compared to last period, with the strongest growth in Electronics category.",
    importance: "high",
    relatedColumns: ["revenue", "category"],
    change: 23.5,
  },
  {
    id: "2",
    type: "anomaly",
    title: "Unusual Spike Detected",
    description:
      "Order volume on March 15th was 340% higher than average. This coincides with a promotional campaign.",
    importance: "medium",
    relatedColumns: ["order_date", "quantity"],
  },
  {
    id: "3",
    type: "correlation",
    title: "Strong Price-Quantity Correlation",
    description:
      "Products priced between $20-50 show 2.3x higher conversion rates than premium items.",
    importance: "high",
    relatedColumns: ["price", "quantity"],
  },
  {
    id: "4",
    type: "recommendation",
    title: "Optimize East Region",
    description:
      "East region shows highest revenue potential. Consider increasing inventory allocation by 15%.",
    importance: "medium",
    relatedColumns: ["region", "revenue"],
  },
];

// ==========================================
// Insight Type Configuration
// ==========================================
const insightConfig: Record<
  InsightType,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  trend: {
    icon: TrendingUp,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  anomaly: {
    icon: AlertTriangle,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  correlation: {
    icon: Activity,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  distribution: {
    icon: PieChart,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  summary: {
    icon: BarChart3,
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
  recommendation: {
    icon: Lightbulb,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
};

// ==========================================
// Importance Badge
// ==========================================
function ImportanceBadge({
  importance,
}: {
  importance: Insight["importance"];
}) {
  const colors = {
    high: "bg-red-500/10 text-red-500 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    low: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-xs font-medium border",
        colors[importance]
      )}
    >
      {importance}
    </span>
  );
}

// ==========================================
// Single Insight Card
// ==========================================
interface InsightCardProps {
  insight: Insight;
  onClick?: (insight: Insight) => void;
}

function InsightCard({ insight, onClick }: InsightCardProps) {
  const config = insightConfig[insight.type];
  const Icon = config.icon;

  return (
    <Card
      className="group cursor-pointer hover:border-primary/30"
      interactive
      onClick={() => onClick?.(insight)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-xl", config.bgColor)}>
          <Icon className={cn("w-5 h-5", config.color)} />
        </div>
        <ImportanceBadge importance={insight.importance} />
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
        {insight.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
        {insight.description}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {/* Related columns */}
        <div className="flex items-center gap-1 flex-wrap">
          {insight.relatedColumns.slice(0, 2).map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded text-xs text-gray-600 dark:text-gray-400"
            >
              {col}
            </span>
          ))}
          {insight.relatedColumns.length > 2 && (
            <span className="text-xs text-gray-400">
              +{insight.relatedColumns.length - 2}
            </span>
          )}
        </div>

        {/* Arrow */}
        <ArrowRight
          className={cn(
            "w-4 h-4 text-gray-400",
            "group-hover:text-primary group-hover:translate-x-1",
            "transition-all"
          )}
        />
      </div>
    </Card>
  );
}

// ==========================================
// Insights Grid Component
// ==========================================
interface InsightsGridProps {
  insights?: Insight[];
  onInsightClick?: (insight: Insight) => void;
  className?: string;
}

export function InsightsGrid({
  insights = sampleInsights,
  onInsightClick,
  className,
}: InsightsGridProps) {
  return (
    <div className={className}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader
          action={
            <Button variant="ghost" size="sm" rightIcon={<Zap className="w-4 h-4" />}>
              Regenerate
            </Button>
          }
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>AI Insights</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Automatically discovered patterns and recommendations
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onClick={onInsightClick}
          />
        ))}
      </div>

      {/* Empty State */}
      {insights.length === 0 && (
        <Card className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            No insights yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Upload a dataset to generate AI-powered insights
          </p>
        </Card>
      )}
    </div>
  );
}

// ==========================================
// Loading Skeleton
// ==========================================
export function InsightCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 bg-gray-200 dark:bg-white/10 rounded-xl" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
      </div>
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-white/10 rounded mb-2" />
      <div className="h-4 w-full bg-gray-200 dark:bg-white/10 rounded mb-1" />
      <div className="h-4 w-2/3 bg-gray-200 dark:bg-white/10 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-200 dark:bg-white/10 rounded" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-white/10 rounded" />
      </div>
    </Card>
  );
}

export function InsightsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <InsightCardSkeleton key={i} />
      ))}
    </div>
  );
}