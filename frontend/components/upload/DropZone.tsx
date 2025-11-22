"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Database,
  Sparkles,
  Zap,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";
import { useFileUpload } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { UploadStatus } from "@/types";

// ==========================================
// Status Icons & Colors
// ==========================================
const statusConfig: Record<
  UploadStatus,
  { icon: React.ElementType; color: string; text: string }
> = {
  idle: {
    icon: Upload,
    color: "text-primary",
    text: "Drop your dataset here",
  },
  uploading: {
    icon: Loader2,
    color: "text-primary",
    text: "Uploading...",
  },
  parsing: {
    icon: FileSpreadsheet,
    color: "text-amber-500",
    text: "Parsing file...",
  },
  analyzing: {
    icon: Sparkles,
    color: "text-purple-500",
    text: "AI is analyzing...",
  },
  complete: {
    icon: CheckCircle,
    color: "text-emerald-500",
    text: "Upload complete!",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    text: "Upload failed",
  },
};

// ==========================================
// Feature Pills
// ==========================================
const features = [
  { icon: Zap, label: "Auto-detect schemas" },
  { icon: BarChart3, label: "Smart visualizations" },
  { icon: MessageSquare, label: "Natural language queries" },
];

// ==========================================
// Progress Bar Component
// ==========================================
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ==========================================
// Main DropZone Component
// ==========================================
export function DropZone() {
  const { upload, status, progress, error, reset, isUploading } = useFileUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setSelectedFile(file);
        upload(file);
      }
    },
    [upload]
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "text/csv": [".csv"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
        "application/vnd.ms-excel": [".xls"],
      },
      maxFiles: 1,
      disabled: isUploading,
    });

  // Get current status config
  const currentStatus = statusConfig[status];
  const StatusIcon = currentStatus.icon;

  // Handle reset
  const handleReset = () => {
    reset();
    setSelectedFile(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <Card
        variant="glass"
        padding="lg"
        className={cn(
          "max-w-xl w-full transition-all duration-300",
          isDragActive && "scale-[1.02] border-primary/50"
        )}
      >
        {/* Dropzone Area */}
        <div
          {...getRootProps()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-12",
            "transition-all duration-200 cursor-pointer",
            "flex flex-col items-center justify-center text-center",
            isDragActive && !isDragReject && "border-primary bg-primary/5",
            isDragReject && "border-red-500 bg-red-500/5",
            !isDragActive &&
              status === "idle" &&
              "border-gray-300 dark:border-white/10 hover:border-primary/50",
            status === "error" && "border-red-500/50",
            status === "complete" && "border-emerald-500/50",
            isUploading && "pointer-events-none"
          )}
        >
          <input {...getInputProps()} />

          {/* Icon */}
          <div
            className={cn(
              "w-20 h-20 rounded-2xl mb-6",
              "flex items-center justify-center",
              "bg-gradient-to-br from-primary/20 to-accent/20"
            )}
          >
            <StatusIcon
              className={cn(
                "w-10 h-10",
                currentStatus.color,
                status === "uploading" && "animate-spin"
              )}
            />
          </div>

          {/* Status Text */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isDragActive
              ? isDragReject
                ? "Invalid file type"
                : "Drop it here!"
              : currentStatus.text}
          </h2>

          {/* Subtitle based on status */}
          {status === "idle" && (
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              or click to browse files
            </p>
          )}

          {status === "error" && error && (
            <p className="text-red-500 text-sm mb-6">{error}</p>
          )}

          {/* Progress Bar */}
          {(status === "uploading" ||
            status === "parsing" ||
            status === "analyzing") && (
            <div className="w-full max-w-xs mb-6">
              <ProgressBar progress={progress} />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {progress}% complete
              </p>
            </div>
          )}

          {/* File Info */}
          {selectedFile && status !== "idle" && (
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-xl mb-6",
                "bg-gray-100 dark:bg-white/5"
              )}
            >
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              {(status === "error" || status === "complete") && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Upload Button */}
          {status === "idle" && (
            <Button
              variant="primary"
              size="lg"
              leftIcon={<Database className="w-5 h-5" />}
            >
              Upload CSV / Excel
            </Button>
          )}

          {/* Retry Button */}
          {status === "error" && (
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            >
              Try Again
            </Button>
          )}

          {/* Continue Button */}
          {status === "complete" && (
            <Button
              variant="primary"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = "/dashboard";
              }}
            >
              View Dashboard
            </Button>
          )}
        </div>

        {/* AI Helper Text */}
        <p className="text-center text-gray-500 dark:text-gray-400 mt-6 text-sm">
          <Sparkles className="w-4 h-4 inline mr-1 text-primary" />
          AI will automatically detect relationships and generate charts
        </p>
      </Card>

      {/* Feature Pills */}
      <div className="flex gap-4 mt-8 flex-wrap justify-center">
        {features.map((feature, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5",
              "bg-white/60 dark:bg-dark-surface/60",
              "backdrop-blur-xl border border-gray-200 dark:border-white/5",
              "rounded-full text-sm"
            )}
          >
            <feature.icon className="w-4 h-4 text-primary" />
            <span className="text-gray-700 dark:text-gray-300">
              {feature.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}