/**
 * API Client
 * Handles all communication with the backend
 */

import type {
    Dataset,
    Analysis,
    ChartConfig,
    Insight,
    KPIMetric,
    ChatMessage,
    ChatSession,
    ApiResponse,
  } from "@/types";
  
  // ===========================================
  // Configuration
  // ===========================================
  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const API_VERSION = "/api/v1";
  
  // ===========================================
  // Types
  // ===========================================
  
  interface RequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    headers?: Record<string, string>;
    timeout?: number;
  }
  
  interface UploadOptions {
    onProgress?: (progress: number) => void;
  }
  
  // ===========================================
  // Base API Client
  // ===========================================
  
  class APIClient {
    private baseUrl: string;
  
    constructor(baseUrl: string = API_BASE_URL) {
      this.baseUrl = baseUrl + API_VERSION;
    }
  
    /**
     * Make an API request
     */
    private async request<T>(
      endpoint: string,
      options: RequestOptions = {}
    ): Promise<ApiResponse<T>> {
      const { method = "GET", body, headers = {}, timeout = 30000 } = options;
  
      const url = `${this.baseUrl}${endpoint}`;
  
      const config: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      };
  
      if (body && method !== "GET") {
        config.body = JSON.stringify(body);
      }
  
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      config.signal = controller.signal;
  
      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new APIError(
            data.error?.message || "Request failed",
            response.status,
            data.error?.code || "REQUEST_FAILED"
          );
        }
  
        return data;
      } catch (error) {
        clearTimeout(timeoutId);
  
        if (error instanceof APIError) {
          throw error;
        }
  
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new APIError("Request timeout", 408, "TIMEOUT");
          }
          throw new APIError(error.message, 500, "NETWORK_ERROR");
        }
  
        throw new APIError("Unknown error", 500, "UNKNOWN_ERROR");
      }
    }
  
    /**
     * Upload a file
     */
    async uploadFile(
      file: File,
      options: UploadOptions = {}
    ): Promise<ApiResponse<Dataset>> {
      const { onProgress } = options;
  
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append("file", file);
  
        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });
        }
  
        xhr.addEventListener("load", () => {
          try {
            const response = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(response);
            } else {
              reject(
                new APIError(
                  response.error?.message || "Upload failed",
                  xhr.status,
                  response.error?.code || "UPLOAD_FAILED"
                )
              );
            }
          } catch {
            reject(new APIError("Invalid response", 500, "PARSE_ERROR"));
          }
        });
  
        xhr.addEventListener("error", () => {
          reject(new APIError("Network error", 0, "NETWORK_ERROR"));
        });
  
        xhr.addEventListener("abort", () => {
          reject(new APIError("Upload cancelled", 0, "CANCELLED"));
        });
  
        xhr.open("POST", `${this.baseUrl}/upload`);
        xhr.send(formData);
      });
    }
  
    // ===========================================
    // Upload Endpoints
    // ===========================================
  
    async getUpload(id: string): Promise<ApiResponse<Dataset>> {
      return this.request(`/upload/${id}`);
    }
  
    async deleteUpload(id: string): Promise<ApiResponse<void>> {
      return this.request(`/upload/${id}`, { method: "DELETE" });
    }
  
    async getUploadPreview(
      id: string,
      rows: number = 10
    ): Promise<ApiResponse<{ columns: string[]; rows: Record<string, unknown>[] }>> {
      return this.request(`/upload/${id}/preview?rows=${rows}`);
    }
  
    // ===========================================
    // Analysis Endpoints
    // ===========================================
  
    async startAnalysis(datasetId: string): Promise<ApiResponse<{ id: string }>> {
      return this.request(`/analysis/${datasetId}`, { method: "POST" });
    }
  
    async getAnalysis(id: string): Promise<ApiResponse<Analysis>> {
      return this.request(`/analysis/${id}`);
    }
  
    async getCharts(analysisId: string): Promise<ApiResponse<ChartConfig[]>> {
      return this.request(`/analysis/${analysisId}/charts`);
    }
  
    async getInsights(analysisId: string): Promise<ApiResponse<Insight[]>> {
      return this.request(`/analysis/${analysisId}/insights`);
    }
  
    async getKPIs(analysisId: string): Promise<ApiResponse<KPIMetric[]>> {
      return this.request(`/analysis/${analysisId}/kpis`);
    }
  
    async deleteAnalysis(id: string): Promise<ApiResponse<void>> {
      return this.request(`/analysis/${id}`, { method: "DELETE" });
    }
  
    // ===========================================
    // Chat Endpoints
    // ===========================================
  
    async sendChatMessage(
      message: string,
      sessionId?: string,
      datasetId?: string
    ): Promise<ApiResponse<{ session_id: string; message: ChatMessage }>> {
      return this.request("/chat", {
        method: "POST",
        body: {
          message,
          session_id: sessionId,
          dataset_id: datasetId,
          stream: false,
        },
      });
    }
  
    async *streamChatMessage(
      message: string,
      sessionId?: string,
      datasetId?: string
    ): AsyncGenerator<string, void, unknown> {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          dataset_id: datasetId,
          stream: true,
        }),
      });
  
      if (!response.ok) {
        throw new APIError("Chat request failed", response.status, "CHAT_FAILED");
      }
  
      const reader = response.body?.getReader();
      if (!reader) {
        throw new APIError("No response body", 500, "NO_BODY");
      }
  
      const decoder = new TextDecoder();
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
  
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                yield data.chunk;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }
  
    async getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
      return this.request("/chat/sessions");
    }
  
    async getChatSession(id: string): Promise<ApiResponse<ChatSession>> {
      return this.request(`/chat/sessions/${id}`);
    }
  
    async deleteChatSession(id: string): Promise<ApiResponse<void>> {
      return this.request(`/chat/sessions/${id}`, { method: "DELETE" });
    }
  
    async clearChatSession(id: string): Promise<ApiResponse<void>> {
      return this.request(`/chat/sessions/${id}/clear`, { method: "POST" });
    }
  
    // ===========================================
    // Health Check
    // ===========================================
  
    async healthCheck(): Promise<{ status: string; version: string }> {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.json();
    }
  }
  
  // ===========================================
  // Custom Error Class
  // ===========================================
  
  export class APIError extends Error {
    status: number;
    code: string;
  
    constructor(message: string, status: number, code: string) {
      super(message);
      this.name = "APIError";
      this.status = status;
      this.code = code;
    }
  }
  
  // ===========================================
  // Export Singleton Instance
  // ===========================================
  
  export const api = new APIClient();
  
  // Export individual methods for convenience
  export const {
    uploadFile,
    getUpload,
    deleteUpload,
    getUploadPreview,
    startAnalysis,
    getAnalysis,
    getCharts,
    getInsights,
    getKPIs,
    deleteAnalysis,
    sendChatMessage,
    streamChatMessage,
    getChatSessions,
    getChatSession,
    deleteChatSession,
    clearChatSession,
    healthCheck,
  } = api;