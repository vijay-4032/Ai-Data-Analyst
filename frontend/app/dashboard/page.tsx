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
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChatToggleButton } from "@/components/chat/ChatToggleButton";
import { useDataStore, useHasData } from "@/stores/useDataStore";
import { useChatStore } from "@/stores/useChatStore";
import type { KPIMetric } from "@/types";

// ==========================================
// Sample Data (Replace with real data)
// ==========================================
const sampleKPIs: KPIMetric[] = [
  {
    id: "1",
    label: "Total Revenue",
    value: 48200,
    format: "currency",
    change: 23.5,
    trend: "up",
  },
  {
    id: "2",
    label: "Transactions",
    value: 1847,
    format: "number",
    change: 12.3,
    trend: "up",
  },
  {
    id: "3",
    label: "Avg Order Value",
    value: 26.1,
    format: "currency",
    change: 8.7,
    trend: "up",
  },
  {
    id: "4",
    label: "AI Confidence",
    value: 94.2,
    format: "percent",
    change: 2.1,
    trend: "up",
  },
];

const sampleAreaData = [
  { month: "Jan", value: 4200, previous: 3800 },
  { month: "Feb", value: 5100, previous: 4200 },
  { month: "Mar", value: 4800, previous: 4500 },
  { month: "Apr", value: 6200, previous: 5100 },
  { month: "May", value: 7100, previous: 5800 },
  { month: "Jun", value: 8400, previous: 6200 },
];

const sampleBarData = [
  { region: "North", sales: 12400 },
  { region: "South", sales: 9800 },
  { region: "East", sales: 15200 },
  { region: "West", sales: 11600 },
];

const samplePieData = [
  { name: "Electronics", value: 35 },
  { name: "Clothing", value: 28 },
  { name: "Home", value: 22 },
  { name: "Other", value: 15 },
];

// ==========================================
// Dashboard Page Component
// ==========================================
export default function DashboardPage() {
  const router = useRouter();
  const hasData = useHasData();
  const dataset = useDataStore((state) => state.dataset);
  const { isOpen: isChatOpen } = useChatStore();

  // Redirect to home if no data
  useEffect(() => {
    // Comment out for development to see dashboard without data
    // if (!hasData) {
    //   router.push("/");
    // }
  }, [hasData, router]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {dataset
              ? `Analyzing ${dataset.name} • ${dataset.rowCount.toLocaleString()} rows`
              : "AI-powered insights from your data"}
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
            <KPIGrid kpis={sampleKPIs} className="mb-6" />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Area Chart */}
              <ChartCard
                title="Sales Trend Over Time"
                description="Monthly revenue comparison"
              >
                <AreaChartComponent
                  data={sampleAreaData}
                  xKey="month"
                  yKey="value"
                  secondaryKey="previous"
                />
              </ChartCard>

              {/* Pie Chart */}
              <ChartCard
                title="Category Distribution"
                description="Revenue by product category"
              >
                <PieChartComponent data={samplePieData} />
              </ChartCard>
            </div>

            {/* Full Width Bar Chart */}
            <ChartCard
              title="Regional Performance"
              description="Sales breakdown by region"
              className="mb-6"
            >
              <BarChartComponent
                data={sampleBarData}
                xKey="region"
                yKey="sales"
              />
            </ChartCard>

            {/* Insights Grid */}
            <InsightsGrid />
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