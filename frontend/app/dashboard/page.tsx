"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { KPIGrid } from "@/components/dashboard/KPICard";
import { InsightsGrid } from "@/components/dashboard/InsightsGrid";
import { ChartCard } from "@/components/charts/ChartCard";
import { AreaChartComponent } from "@/components/charts/AreaChart";
import { BarChartComponent } from "@/components/charts/BarChart";
import { PieChartComponent } from "@/components/charts/PieChart";
import { ChatPanel, ChatToggleButton } from "@/components/chat/ChatPanel";
import { useDataStore, useHasData } from "@/stores/useDataStore";
import { useChatStore } from "@/stores/useChatStore";
import { useAnalysis } from "@/hooks/useAnalysis";
import { Card } from "@/components/ui/Card";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const hasData = useHasData();
  const dataset = useDataStore((state) => state.dataset);
  const { isOpen: isChatOpen } = useChatStore();

  // Start analysis automatically
  const {
    charts,
    insights,
    kpis,
    isAnalyzing,
    isLoading,
    error,
    startAnalysis,
  } = useAnalysis({
    autoStart: true,
  });

  // Redirect to home if no data
  useEffect(() => {
    if (!hasData && !isLoading) {
      router.push("/");
    }
  }, [hasData, isLoading, router]);

  // Start analysis when dataset is available
  useEffect(() => {
    if (dataset?.id && !isAnalyzing && charts.length === 0) {
      startAnalysis(dataset.id);
    }
  }, [dataset?.id, isAnalyzing, charts.length, startAnalysis]);

  // Show loading state
  if (!dataset || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-[70vh]">
          <Card className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Please wait while we load your data
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Analyzing Your Data
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {dataset.name} • {dataset.rowCount.toLocaleString()} rows
            </p>
          </div>

          <Card className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                <div className="absolute inset-4 rounded-full border-4 border-transparent border-t-accent animate-spin" style={{ animationDuration: "1.5s" }}></div>
              </div>
              <h2 className="text-2xl font-bold mb-2">AI is Analyzing Your Data</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                This usually takes a few seconds...
              </p>
              <div className="text-sm text-gray-400">
                <p>✓ Profiling data structure</p>
                <p>✓ Detecting patterns</p>
                <p>✓ Generating visualizations</p>
                <p className="text-primary">⟳ Creating insights...</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-6">
          <Card className="p-8 text-center border-red-500/20 bg-red-500/5">
            <h2 className="text-xl font-semibold text-red-500 mb-2">Analysis Failed</h2>
            <p className="text-gray-500 dark:text-gray-400">{error}</p>
          </Card>
        </div>
      </div>
    );
  }

  // Show dashboard with real data
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {dataset.name} • {dataset.rowCount.toLocaleString()} rows • {dataset.columnCount} columns
          </p>
        </div>

        {/* Dashboard Grid */}
        <div
          className={`grid gap-6 transition-all duration-300 ${
            isChatOpen ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {/* Main Content Area */}
          <div className={isChatOpen ? "lg:col-span-2" : ""}>
            {/* KPI Cards */}
            {kpis.length > 0 && <KPIGrid kpis={kpis} className="mb-6" />}

            {/* Charts Grid */}
            {charts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {charts.slice(0, 4).map((chart) => (
                  <ChartCard
                    key={chart.id}
                    title={chart.title}
                    description={chart.description}
                  >
                    {chart.type === "area" || chart.type === "line" ? (
                      <AreaChartComponent
                        data={chart.data}
                        xKey={chart.x_axis?.field || "x"}
                        yKey={chart.y_axis?.field || "y"}
                        type={chart.type}
                      />
                    ) : chart.type === "bar" ? (
                      <BarChartComponent
                        data={chart.data}
                        xKey={chart.x_axis?.field || "x"}
                        yKey={chart.y_axis?.field || "y"}
                      />
                    ) : chart.type === "pie" ? (
                      <PieChartComponent data={chart.data} />
                    ) : null}
                  </ChartCard>
                ))}
              </div>
            )}

            {/* Show message if no charts */}
            {charts.length === 0 && !isAnalyzing && (
              <Card className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No visualizations generated yet. The AI is still analyzing your data.
                </p>
              </Card>
            )}

            {/* Insights Grid */}
            {insights.length > 0 && <InsightsGrid insights={insights} />}
          </div>

          {/* Chat Panel (conditionally rendered) */}
          {isChatOpen && (
            <div className="lg:col-span-1">
              <ChatPanel />
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Toggle Button */}
      {!isChatOpen && <ChatToggleButton />}
    </div>
  );
}