/**
 * useAnalysis Hook
 * Manages data analysis state and API calls
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { api, APIError } from "@/lib/api";
import { useDataStore } from "@/stores/useDataStore";
import { toast } from "@/components/ui/Toaster";
import type { Analysis, ChartConfig, Insight, KPIMetric } from "@/types";

// ===========================================
// Types
// ===========================================

interface UseAnalysisOptions {
  autoStart?: boolean;
  pollInterval?: number;
  onComplete?: (analysis: Analysis) => void;
  onError?: (error: Error) => void;
}

interface UseAnalysisReturn {
  // State
  analysis: Analysis | null;
  charts: ChartConfig[];
  insights: Insight[];
  kpis: KPIMetric[];
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  progress: number;

  // Actions
  startAnalysis: (datasetId: string) => Promise<void>;
  refreshAnalysis: () => Promise<void>;
  reset: () => void;
}

// ===========================================
// Hook Implementation
// ===========================================

export function useAnalysis(options: UseAnalysisOptions = {}): UseAnalysisReturn {
  const {
    autoStart = false,
    pollInterval = 2000,
    onComplete,
    onError,
  } = options;

  // State
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Refs for polling
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const analysisIdRef = useRef<string | null>(null);

  // Store actions
  const {
    dataset,
    setCharts,
    setInsights,
    setKPIs,
    setIsAnalyzing: setStoreAnalyzing,
  } = useDataStore();

  // ===========================================
  // Polling Logic
  // ===========================================

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollAnalysisStatus = useCallback(
    async (analysisId: string) => {
      try {
        const response = await api.getAnalysis(analysisId);
        const data = response.data;

        if (!data) return;

        setAnalysis(data);

        // Update progress based on status
        switch (data.status) {
          case "pending":
            setProgress(10);
            break;
          case "processing":
            setProgress(50);
            break;
          case "completed":
            setProgress(100);
            setIsAnalyzing(false);
            setStoreAnalyzing(false);
            stopPolling();

            // Update store with results
            setCharts(data.charts || []);
            setInsights(data.insights || []);
            setKPIs(data.kpis || []);

            // Callback
            onComplete?.(data);
            toast.success("Analysis complete", `Generated ${data.charts?.length || 0} visualizations`);
            break;
          case "failed":
            setProgress(0);
            setIsAnalyzing(false);
            setStoreAnalyzing(false);
            stopPolling();
            setError(data.error || "Analysis failed");
            onError?.(new Error(data.error || "Analysis failed"));
            toast.error("Analysis failed", data.error);
            break;
        }
      } catch (err) {
        const message = err instanceof APIError ? err.message : "Failed to check analysis status";
        setError(message);
        stopPolling();
      }
    },
    [stopPolling, setCharts, setInsights, setKPIs, setStoreAnalyzing, onComplete, onError]
  );

  // ===========================================
  // Start Analysis
  // ===========================================

  const startAnalysis = useCallback(
    async (datasetId: string) => {
      setIsLoading(true);
      setIsAnalyzing(true);
      setStoreAnalyzing(true);
      setError(null);
      setProgress(0);

      try {
        // Start analysis
        const response = await api.startAnalysis(datasetId);
        const analysisId = response.data?.id;

        if (!analysisId) {
          throw new Error("No analysis ID returned");
        }

        analysisIdRef.current = analysisId;
        setProgress(10);

        toast.info("Analysis started", "AI is analyzing your data...");

        // Start polling for status
        pollRef.current = setInterval(() => {
          pollAnalysisStatus(analysisId);
        }, pollInterval);

        // Initial poll
        await pollAnalysisStatus(analysisId);
      } catch (err) {
        const message = err instanceof APIError ? err.message : "Failed to start analysis";
        setError(message);
        setIsAnalyzing(false);
        setStoreAnalyzing(false);
        toast.error("Analysis failed", message);
        onError?.(err instanceof Error ? err : new Error(message));
      } finally {
        setIsLoading(false);
      }
    },
    [pollInterval, pollAnalysisStatus, setStoreAnalyzing, onError]
  );

  // ===========================================
  // Refresh Analysis
  // ===========================================

  const refreshAnalysis = useCallback(async () => {
    if (!analysisIdRef.current) {
      // If no existing analysis, start new one with current dataset
      if (dataset?.id) {
        await startAnalysis(dataset.id);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getAnalysis(analysisIdRef.current);
      const data = response.data;

      if (data) {
        setAnalysis(data);
        setCharts(data.charts || []);
        setInsights(data.insights || []);
        setKPIs(data.kpis || []);
      }
    } catch (err) {
      const message = err instanceof APIError ? err.message : "Failed to refresh analysis";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [dataset?.id, startAnalysis, setCharts, setInsights, setKPIs]);

  // ===========================================
  // Reset
  // ===========================================

  const reset = useCallback(() => {
    stopPolling();
    setAnalysis(null);
    setIsLoading(false);
    setIsAnalyzing(false);
    setError(null);
    setProgress(0);
    analysisIdRef.current = null;
  }, [stopPolling]);

  // ===========================================
  // Auto-start analysis
  // ===========================================

  useEffect(() => {
    if (autoStart && dataset?.id && !analysis && !isAnalyzing) {
      startAnalysis(dataset.id);
    }
  }, [autoStart, dataset?.id, analysis, isAnalyzing, startAnalysis]);

  // ===========================================
  // Cleanup on unmount
  // ===========================================

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // ===========================================
  // Return
  // ===========================================

  return {
    // State
    analysis,
    charts: analysis?.charts || [],
    insights: analysis?.insights || [],
    kpis: analysis?.kpis || [],
    isLoading,
    isAnalyzing,
    error,
    progress,

    // Actions
    startAnalysis,
    refreshAnalysis,
    reset,
  };
}

// ===========================================
// Convenience Hooks
// ===========================================

/**
 * Hook to get charts only
 */
export function useCharts(analysisId?: string) {
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await api.getCharts(id);
      setCharts(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch charts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (analysisId) {
      fetchCharts(analysisId);
    }
  }, [analysisId, fetchCharts]);

  return { charts, isLoading, error, refetch: fetchCharts };
}

/**
 * Hook to get insights only
 */
export function useInsights(analysisId?: string) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await api.getInsights(id);
      setInsights(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (analysisId) {
      fetchInsights(analysisId);
    }
  }, [analysisId, fetchInsights]);

  return { insights, isLoading, error, refetch: fetchInsights };
}

/**
 * Hook to get KPIs only
 */
export function useKPIs(analysisId?: string) {
  const [kpis, setKPIs] = useState<KPIMetric[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const response = await api.getKPIs(id);
      setKPIs(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch KPIs");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (analysisId) {
      fetchKPIs(analysisId);
    }
  }, [analysisId, fetchKPIs]);

  return { kpis, isLoading, error, refetch: fetchKPIs };
}