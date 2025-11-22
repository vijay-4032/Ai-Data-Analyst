import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  Dataset,
  Column,
  Analysis,
  ChartConfig,
  Insight,
  KPIMetric,
  UploadStatus,
} from "@/types";

// ==========================================
// State Interface
// ==========================================
interface DataState {
  // Dataset
  dataset: Dataset | null;
  rawData: Record<string, unknown>[] | null;
  
  // Analysis results
  analysis: Analysis | null;
  charts: ChartConfig[];
  insights: Insight[];
  kpis: KPIMetric[];
  
  // Upload state
  uploadStatus: UploadStatus;
  uploadProgress: number;
  uploadError: string | null;
  
  // UI state
  selectedChartId: string | null;
  isAnalyzing: boolean;
}

// ==========================================
// Actions Interface
// ==========================================
interface DataActions {
  // Dataset actions
  setDataset: (dataset: Dataset) => void;
  setRawData: (data: Record<string, unknown>[]) => void;
  clearDataset: () => void;
  
  // Analysis actions
  setAnalysis: (analysis: Analysis) => void;
  setCharts: (charts: ChartConfig[]) => void;
  setInsights: (insights: Insight[]) => void;
  setKPIs: (kpis: KPIMetric[]) => void;
  
  // Upload actions
  setUploadStatus: (status: UploadStatus) => void;
  setUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;
  resetUpload: () => void;
  
  // UI actions
  selectChart: (chartId: string | null) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  
  // Reset all
  reset: () => void;
}

// ==========================================
// Initial State
// ==========================================
const initialState: DataState = {
  dataset: null,
  rawData: null,
  analysis: null,
  charts: [],
  insights: [],
  kpis: [],
  uploadStatus: "idle",
  uploadProgress: 0,
  uploadError: null,
  selectedChartId: null,
  isAnalyzing: false,
};

// ==========================================
// Store
// ==========================================
export const useDataStore = create<DataState & DataActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Dataset actions
        setDataset: (dataset) => {
          set({ dataset }, false, "setDataset");
        },

        setRawData: (rawData) => {
          set({ rawData }, false, "setRawData");
        },

        clearDataset: () => {
          set(
            {
              dataset: null,
              rawData: null,
              analysis: null,
              charts: [],
              insights: [],
              kpis: [],
            },
            false,
            "clearDataset"
          );
        },

        // Analysis actions
        setAnalysis: (analysis) => {
          set(
            {
              analysis,
              charts: analysis.charts || [],
              insights: analysis.insights || [],
            },
            false,
            "setAnalysis"
          );
        },

        setCharts: (charts) => {
          set({ charts }, false, "setCharts");
        },

        setInsights: (insights) => {
          set({ insights }, false, "setInsights");
        },

        setKPIs: (kpis) => {
          set({ kpis }, false, "setKPIs");
        },

        // Upload actions
        setUploadStatus: (uploadStatus) => {
          set({ uploadStatus }, false, "setUploadStatus");
        },

        setUploadProgress: (uploadProgress) => {
          set({ uploadProgress }, false, "setUploadProgress");
        },

        setUploadError: (uploadError) => {
          set({ uploadError, uploadStatus: "error" }, false, "setUploadError");
        },

        resetUpload: () => {
          set(
            {
              uploadStatus: "idle",
              uploadProgress: 0,
              uploadError: null,
            },
            false,
            "resetUpload"
          );
        },

        // UI actions
        selectChart: (selectedChartId) => {
          set({ selectedChartId }, false, "selectChart");
        },

        setIsAnalyzing: (isAnalyzing) => {
          set({ isAnalyzing }, false, "setIsAnalyzing");
        },

        // Reset all
        reset: () => {
          set(initialState, false, "reset");
        },
      }),
      {
        name: "ai-analyst-data",
        // Only persist these fields
        partialize: (state) => ({
          dataset: state.dataset,
          charts: state.charts,
          insights: state.insights,
          kpis: state.kpis,
        }),
      }
    ),
    { name: "DataStore" }
  )
);

// ==========================================
// Selectors (for optimized re-renders)
// ==========================================
export const useDataset = () => useDataStore((state) => state.dataset);
export const useCharts = () => useDataStore((state) => state.charts);
export const useInsights = () => useDataStore((state) => state.insights);
export const useKPIs = () => useDataStore((state) => state.kpis);
export const useUploadStatus = () => useDataStore((state) => ({
  status: state.uploadStatus,
  progress: state.uploadProgress,
  error: state.uploadError,
}));
export const useIsAnalyzing = () => useDataStore((state) => state.isAnalyzing);

// ==========================================
// Helper: Check if data is loaded
// ==========================================
export const useHasData = () => useDataStore((state) => state.dataset !== null);