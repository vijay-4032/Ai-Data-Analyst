"use client";

import { useState } from "react";
import {
  Sparkles,
  Maximize2,
  Download,
  MoreVertical,
  RefreshCw,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button, IconButton } from "@/components/ui/Button";

// ==========================================
// Types
// ==========================================
interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  onExplain?: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onExpand?: () => void;
  showActions?: boolean;
  isLoading?: boolean;
  className?: string;
}

// ==========================================
// Dropdown Menu
// ==========================================
interface DropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  onExport?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

function ChartDropdown({
  isOpen,
  onClose,
  onRefresh,
  onExport,
  onShare,
  onDelete,
}: DropdownProps) {
  if (!isOpen) return null;

  const items = [
    { icon: RefreshCw, label: "Refresh", onClick: onRefresh },
    { icon: Download, label: "Export", onClick: onExport },
    { icon: Share2, label: "Share", onClick: onShare },
    { icon: Trash2, label: "Remove", onClick: onDelete, danger: true },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-10" onClick={onClose} />

      {/* Menu */}
      <div
        className={cn(
          "absolute right-0 top-full mt-2 z-20",
          "w-48 py-2",
          "bg-white dark:bg-dark-surface",
          "border border-gray-200 dark:border-white/10",
          "rounded-xl shadow-lg",
          "animate-in"
        )}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => {
              item.onClick?.();
              onClose();
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5",
              "text-sm text-left transition-colors",
              item.danger
                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ==========================================
// Loading Skeleton
// ==========================================
function ChartSkeleton() {
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading chart...
        </span>
      </div>
    </div>
  );
}

// ==========================================
// Main Chart Card Component
// ==========================================
export function ChartCard({
  title,
  description,
  children,
  onExplain,
  onRefresh,
  onExport,
  onExpand,
  showActions = true,
  isLoading = false,
  className,
}: ChartCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle expand
  const handleExpand = () => {
    setIsExpanded(true);
    onExpand?.();
  };

  // Handle close expanded view
  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };

  // Chart content
  const chartContent = (
    <Card className={cn("relative", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1">
            {/* AI Explain Button */}
            <IconButton
              icon={<Sparkles className="w-4 h-4" />}
              aria-label="Explain with AI"
              onClick={onExplain}
              className="text-primary hover:bg-primary/10"
              size="sm"
            />

            {/* Expand Button */}
            <IconButton
              icon={<Maximize2 className="w-4 h-4" />}
              aria-label="Expand chart"
              onClick={handleExpand}
              size="sm"
            />

            {/* More Options */}
            <div className="relative">
              <IconButton
                icon={<MoreVertical className="w-4 h-4" />}
                aria-label="More options"
                onClick={() => setMenuOpen(!menuOpen)}
                size="sm"
              />
              <ChartDropdown
                isOpen={menuOpen}
                onClose={() => setMenuOpen(false)}
                onRefresh={onRefresh}
                onExport={onExport}
              />
            </div>
          </div>
        )}
      </div>

      {/* Chart Content */}
      {isLoading ? <ChartSkeleton /> : children}
    </Card>
  );

  // Expanded modal view
  if (isExpanded) {
    return (
      <>
        {/* Original card placeholder */}
        <Card className={cn("relative", className)}>
          <div className="h-[300px] flex items-center justify-center">
            <span className="text-gray-400">Chart expanded</span>
          </div>
        </Card>

        {/* Expanded Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseExpanded}
          />

          {/* Modal Content */}
          <div
            className={cn(
              "relative w-full max-w-5xl max-h-[90vh]",
              "bg-white dark:bg-dark-surface",
              "rounded-2xl shadow-2xl",
              "overflow-hidden",
              "animate-in"
            )}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {description}
                  </p>
                )}
              </div>
              <IconButton
                icon={<X className="w-5 h-5" />}
                aria-label="Close"
                onClick={handleCloseExpanded}
              />
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-100px)]">
              {isLoading ? <ChartSkeleton /> : children}
            </div>
          </div>
        </div>
      </>
    );
  }

  return chartContent;
}

// ==========================================
// Chart Card Skeleton
// ==========================================
export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("animate-pulse", className)}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="h-6 w-48 bg-gray-200 dark:bg-white/10 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mt-2" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-lg" />
          <div className="h-8 w-8 bg-gray-200 dark:bg-white/10 rounded-lg" />
        </div>
      </div>
      <div className="h-[300px] bg-gray-200 dark:bg-white/10 rounded-xl" />
    </Card>
  );
}