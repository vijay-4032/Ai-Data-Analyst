"use client";

import { useState } from "react";
import {
  User,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types";

// ==========================================
// Types
// ==========================================
interface ChatMessageProps {
  message: ChatMessageType;
  onFeedback?: (messageId: string, type: "positive" | "negative") => void;
}

// ==========================================
// Avatar Component
// ==========================================
function MessageAvatar({ role }: { role: ChatMessageType["role"] }) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-lg flex-shrink-0",
        "flex items-center justify-center",
        isAssistant
          ? "bg-gradient-to-br from-primary to-accent"
          : "bg-gray-200 dark:bg-white/10"
      )}
    >
      {isAssistant ? (
        <Sparkles className="w-4 h-4 text-white" />
      ) : (
        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      )}
    </div>
  );
}

// ==========================================
// Message Actions (for assistant messages)
// ==========================================
interface MessageActionsProps {
  messageId: string;
  content: string;
  onFeedback?: (messageId: string, type: "positive" | "negative") => void;
}

function MessageActions({ messageId, content, onFeedback }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);

  // Copy to clipboard
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle feedback
  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type);
    onFeedback?.(messageId, type);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 mt-2",
        "opacity-0 group-hover:opacity-100 transition-opacity"
      )}
    >
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded-lg",
          "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
          "hover:bg-gray-100 dark:hover:bg-white/5",
          "transition-colors"
        )}
        title="Copy message"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Thumbs up */}
      <button
        onClick={() => handleFeedback("positive")}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          feedback === "positive"
            ? "text-emerald-500 bg-emerald-500/10"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
        )}
        title="Good response"
      >
        <ThumbsUp className="w-3.5 h-3.5" />
      </button>

      {/* Thumbs down */}
      <button
        onClick={() => handleFeedback("negative")}
        className={cn(
          "p-1.5 rounded-lg transition-colors",
          feedback === "negative"
            ? "text-red-500 bg-red-500/10"
            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
        )}
        title="Poor response"
      >
        <ThumbsDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ==========================================
// Referenced Chart Badge
// ==========================================
function ChartReference({ chartId }: { chartId: string }) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 mt-2",
        "bg-primary/10 text-primary rounded-lg",
        "text-xs font-medium",
        "hover:bg-primary/20 transition-colors"
      )}
    >
      <BarChart3 className="w-3.5 h-3.5" />
      View related chart
    </button>
  );
}

// ==========================================
// Format message content (basic markdown-like)
// ==========================================
function formatContent(content: string): React.ReactNode {
  // Split by lines and handle bullet points
  const lines = content.split("\n");

  return lines.map((line, index) => {
    // Handle bullet points
    if (line.trim().startsWith("•") || line.trim().startsWith("-")) {
      return (
        <div key={index} className="flex items-start gap-2 ml-2">
          <span className="text-primary mt-1">•</span>
          <span>{line.trim().replace(/^[•-]\s*/, "")}</span>
        </div>
      );
    }

    // Handle bold text **text**
    const boldFormatted = line.split(/\*\*(.*?)\*\*/g).map((part, i) =>
      i % 2 === 1 ? (
        <strong key={i} className="font-semibold">
          {part}
        </strong>
      ) : (
        part
      )
    );

    // Regular line
    return (
      <p key={index} className={line.trim() === "" ? "h-2" : ""}>
        {boldFormatted}
      </p>
    );
  });
}

// ==========================================
// Main Chat Message Component
// ==========================================
export function ChatMessage({ message, onFeedback }: ChatMessageProps) {
  const { id, role, content, timestamp, metadata } = message;
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "group flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <MessageAvatar role={role} />

      {/* Message Content */}
      <div
        className={cn(
          "flex flex-col max-w-[85%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        {/* Bubble */}
        <div
          className={cn(
            "px-4 py-3 rounded-2xl",
            isUser
              ? "bg-gradient-to-r from-primary to-accent text-white rounded-br-md"
              : "bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-bl-md"
          )}
        >
          <div className="text-sm leading-relaxed space-y-1">
            {formatContent(content)}
          </div>

          {/* Referenced chart */}
          {metadata?.chartId && !isUser && (
            <ChartReference chartId={metadata.chartId} />
          )}
        </div>

        {/* Timestamp */}
        <span
          className={cn(
            "text-xs text-gray-400 mt-1 px-1",
            isUser ? "text-right" : "text-left"
          )}
        >
          {formatRelativeTime(timestamp)}
        </span>

        {/* Actions (for assistant messages only) */}
        {!isUser && (
          <MessageActions
            messageId={id}
            content={content}
            onFeedback={onFeedback}
          />
        )}
      </div>
    </div>
  );
}