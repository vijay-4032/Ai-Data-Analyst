"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useDataStore } from "@/stores/useDataStore";
import { toast } from "@/components/ui/Toaster";
import { generateId, formatFileSize } from "@/lib/utils";
import type { Dataset, Column, ColumnType, UploadStatus } from "@/types";

// ==========================================
// Configuration
// ==========================================
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const SAMPLE_SIZE = 5; // Number of sample values to store

// ==========================================
// Types
// ==========================================
interface UseFileUploadReturn {
  upload: (file: File) => Promise<void>;
  status: UploadStatus;
  progress: number;
  error: string | null;
  reset: () => void;
  isUploading: boolean;
  validateFile: (file: File) => { valid: boolean; error?: string };
}

// ==========================================
// Helper: Detect column type
// ==========================================
function detectColumnType(values: unknown[]): ColumnType {
  const nonNullValues = values.filter(
    (v) => v !== null && v !== undefined && v !== ""
  );

  if (nonNullValues.length === 0) return "string";

  // Check if all values are booleans
  const booleanValues = nonNullValues.filter(
    (v) =>
      typeof v === "boolean" ||
      v === "true" ||
      v === "false" ||
      v === "0" ||
      v === "1"
  );
  if (booleanValues.length === nonNullValues.length) return "boolean";

  // Check if all values are numbers
  const numericValues = nonNullValues.filter((v) => !isNaN(Number(v)));
  if (numericValues.length === nonNullValues.length) {
    // Check if integers or floats
    const hasDecimals = numericValues.some((v) =>
      String(v).includes(".")
    );
    return hasDecimals ? "float" : "integer";
  }

  // Check if dates
  const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;
  const dateValues = nonNullValues.filter((v) =>
    datePattern.test(String(v))
  );
  if (dateValues.length > nonNullValues.length * 0.8) {
    const hasTime = nonNullValues.some((v) =>
      String(v).includes(":")
    );
    return hasTime ? "datetime" : "date";
  }

  // Check if categorical (low cardinality)
  const uniqueValues = new Set(nonNullValues.map(String));
  if (uniqueValues.size < nonNullValues.length * 0.5 && uniqueValues.size < 20) {
    return "category";
  }

  return "string";
}

// ==========================================
// Helper: Analyze columns
// ==========================================
function analyzeColumns(data: Record<string, unknown>[]): Column[] {
  if (data.length === 0) return [];

  const columnNames = Object.keys(data[0]);

  return columnNames.map((name) => {
    const values = data.map((row) => row[name]);
    const nonNullCount = values.filter(
      (v) => v !== null && v !== undefined && v !== ""
    ).length;
    const uniqueValues = new Set(values.map(String));

    return {
      name,
      type: detectColumnType(values),
      nullable: nonNullCount < values.length,
      unique: uniqueValues.size,
      missing: values.length - nonNullCount,
      sample: values.slice(0, SAMPLE_SIZE),
    };
  });
}

// ==========================================
// Helper: Parse CSV file
// ==========================================
function parseCSV(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [",", "\t", "|", ";"],
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("CSV parsing warnings:", results.errors);
        }
        resolve(results.data as Record<string, unknown>[]);
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

// ==========================================
// Helper: Parse Excel file
// ==========================================
function parseExcel(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, {
          defval: null,
          raw: false,
        });

        resolve(jsonData as Record<string, unknown>[]);
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

// ==========================================
// Main Hook
// ==========================================
export function useFileUpload(): UseFileUploadReturn {
  const {
    setDataset,
    setRawData,
    setUploadStatus,
    setUploadProgress,
    setUploadError,
    resetUpload,
    uploadStatus,
    uploadProgress,
    uploadError,
  } = useDataStore();

  // Validate file
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          error: `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`,
        };
      }

      // Check file extension
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        };
      }

      return { valid: true };
    },
    []
  );

  // Main upload function
  const upload = useCallback(
    async (file: File) => {
      // Validate
      const validation = validateFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || "Invalid file");
        toast.error("Upload failed", validation.error);
        return;
      }

      try {
        // Start upload
        setUploadStatus("uploading");
        setUploadProgress(10);

        // Parse file based on type
        setUploadStatus("parsing");
        setUploadProgress(30);

        const extension = file.name.split(".").pop()?.toLowerCase();
        let parsedData: Record<string, unknown>[];

        if (extension === "csv") {
          parsedData = await parseCSV(file);
        } else {
          parsedData = await parseExcel(file);
        }

        if (parsedData.length === 0) {
          throw new Error("File is empty or has no valid data");
        }

        setUploadProgress(60);

        // Analyze columns
        setUploadStatus("analyzing");
        const columns = analyzeColumns(parsedData);

        setUploadProgress(80);

        // Create dataset object
        const dataset: Dataset = {
          id: generateId("dataset"),
          name: file.name.replace(/\.[^/.]+$/, ""),
          filename: file.name,
          size: file.size,
          rowCount: parsedData.length,
          columnCount: columns.length,
          columns,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Store in state
        setDataset(dataset);
        setRawData(parsedData);

        setUploadProgress(100);
        setUploadStatus("complete");

        toast.success(
          "Upload successful",
          `${parsedData.length} rows and ${columns.length} columns loaded`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed";
        setUploadError(message);
        toast.error("Upload failed", message);
      }
    },
    [validateFile, setDataset, setRawData, setUploadStatus, setUploadProgress, setUploadError]
  );

  // Reset function
  const reset = useCallback(() => {
    resetUpload();
  }, [resetUpload]);

  return {
    upload,
    status: uploadStatus,
    progress: uploadProgress,
    error: uploadError,
    reset,
    isUploading: uploadStatus === "uploading" || uploadStatus === "parsing",
    validateFile,
  };
}