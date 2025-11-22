// ==========================================
// Dataset Types
// ==========================================

export interface Dataset {
    id: string;
    name: string;
    filename: string;
    size: number;
    rowCount: number;
    columnCount: number;
    columns: Column[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface Column {
    name: string;
    type: ColumnType;
    nullable: boolean;
    unique: number;
    missing: number;
    sample: unknown[];
    stats?: ColumnStats;
  }
  
  export type ColumnType = 
    | "string" 
    | "number" 
    | "integer" 
    | "float" 
    | "boolean" 
    | "date" 
    | "datetime" 
    | "category";
  
  export interface ColumnStats {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    std?: number;
    mode?: string | number;
    distribution?: { value: string; count: number }[];
  }
  
  // ==========================================
  // Analysis Types
  // ==========================================
  
  export interface Analysis {
    id: string;
    datasetId: string;
    status: AnalysisStatus;
    insights: Insight[];
    charts: ChartConfig[];
    kpis: KPIMetric[];
    summary: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
  }
  
  export type AnalysisStatus = 
    | "pending" 
    | "processing" 
    | "completed" 
    | "failed";
  
  export interface Insight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    importance: "high" | "medium" | "low";
    relatedColumns: string[];
    value?: string | number;
    change?: number;
  }
  
  export type InsightType = 
    | "trend" 
    | "anomaly" 
    | "correlation" 
    | "distribution" 
    | "summary" 
    | "recommendation";
  
  // ==========================================
  // Chart Types
  // ==========================================
  
  export interface ChartConfig {
    id: string;
    type: ChartType;
    title: string;
    description?: string;
    xAxis?: AxisConfig;
    yAxis?: AxisConfig;
    data: ChartDataPoint[];
    colors?: string[];
    options?: ChartOptions;
  }
  
  export type ChartType = 
    | "line" 
    | "area" 
    | "bar" 
    | "pie" 
    | "donut" 
    | "scatter" 
    | "heatmap" 
    | "kpi";
  
  export interface AxisConfig {
    field: string;
    label: string;
    type: "category" | "value" | "time";
    format?: string;
  }
  
  export interface ChartDataPoint {
    [key: string]: string | number | null;
  }
  
  export interface ChartOptions {
    showLegend?: boolean;
    showGrid?: boolean;
    showTooltip?: boolean;
    stacked?: boolean;
    smooth?: boolean;
    animate?: boolean;
  }
  
  // ==========================================
  // KPI Types
  // ==========================================
  
  export interface KPIMetric {
    id: string;
    label: string;
    value: number | string;
    format: "number" | "currency" | "percent" | "compact";
    change?: number;
    changeLabel?: string;
    trend?: "up" | "down" | "stable";
    icon?: string;
  }
  
  // ==========================================
  // Chat Types
  // ==========================================
  
  export interface ChatMessage {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    metadata?: ChatMetadata;
  }
  
  export interface ChatMetadata {
    sources?: string[];
    chartId?: string;
    insightIds?: string[];
    confidence?: number;
  }
  
  export interface ChatSession {
    id: string;
    datasetId: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
  }
  
  // ==========================================
  // Upload Types
  // ==========================================
  
  export interface UploadProgress {
    status: UploadStatus;
    progress: number;
    filename?: string;
    error?: string;
  }
  
  export type UploadStatus = 
    | "idle" 
    | "uploading" 
    | "parsing" 
    | "analyzing" 
    | "complete" 
    | "error";
  
  export interface FileValidation {
    valid: boolean;
    errors: string[];
    warnings: string[];
  }
  
  // ==========================================
  // User Types
  // ==========================================
  
  export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: string;
    settings: UserSettings;
  }
  
  export interface UserSettings {
    theme: "light" | "dark" | "system";
    defaultCurrency: string;
    dateFormat: string;
    notifications: boolean;
  }
  
  // ==========================================
  // API Types
  // ==========================================
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: ApiError;
    meta?: ApiMeta;
  }
  
  export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
  
  export interface ApiMeta {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  }
  
  // ==========================================
  // UI State Types
  // ==========================================
  
  export interface UIState {
    sidebarOpen: boolean;
    chatPanelOpen: boolean;
    currentModal: ModalType | null;
    toasts: Toast[];
  }
  
  export type ModalType = 
    | "upload" 
    | "export" 
    | "settings" 
    | "share" 
    | "confirm";
  
  export interface Toast {
    id: string;
    type: "success" | "error" | "warning" | "info";
    title: string;
    message?: string;
    duration?: number;
  }
  
  // ==========================================
  // Theme Types
  // ==========================================
  
  export type Theme = "light" | "dark" | "system";
  
  export interface ThemeColors {
    primary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
  }