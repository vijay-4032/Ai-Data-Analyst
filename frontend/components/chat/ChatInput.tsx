"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { Send, Mic, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/stores/useChatStore";

// ==========================================
// Types
// ==========================================
interface ChatInputProps {
  placeholder?: string;
  disabled?: boolean;
  onSend?: (message: string) => void;
}

// ==========================================
// Simulated AI Response (Replace with real API)
// ==========================================
const simulatedResponses = [
  "Based on the data analysis, **revenue growth is primarily driven by a 42% increase** in Electronics sales and strong Q2 performance in the East region.\n\n• Electronics: +42% YoY\n• East Region: Highest performer\n• Q2: Peak revenue period",
  "The trend shows **consistent month-over-month growth averaging 15.3%**. Seasonality peaks in June, suggesting promotional campaigns during this period are highly effective.\n\n• Average growth: 15.3%\n• Peak month: June\n• Lowest: January",
  "Top performing categories are **Electronics (35%) and Clothing (28%)**, together accounting for 63% of total revenue. Consider increasing inventory allocation for these categories.\n\n• Electronics: 35%\n• Clothing: 28%\n• Home: 22%\n• Other: 15%",
  "I detected an **anomaly on March 15th** where order volume was 340% higher than average. This coincides with a promotional campaign. The pattern suggests flash sales significantly boost engagement.",
  "Analyzing the correlation between price and quantity, products priced between **$20-50 show 2.3x higher conversion rates** than premium items above $100. Consider this for pricing strategy.",
];

// ==========================================
// Main Chat Input Component
// ==========================================
export function ChatInput({
  placeholder = "Ask about your data...",
  disabled = false,
  onSend,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const {
    inputValue,
    setInputValue,
    addMessage,
    isLoading,
    setIsLoading,
  } = useChatStore();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Handle send message
  const handleSend = async () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || isLoading || disabled) return;

    // Add user message
    addMessage({
      role: "user",
      content: trimmedValue,
    });

    // Clear input
    setInputValue("");

    // Call custom onSend if provided
    if (onSend) {
      onSend(trimmedValue);
      return;
    }

    // Simulate AI response (replace with real API call)
    setIsLoading(true);

    // Simulate delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000)
    );

    // Add AI response
    const randomResponse =
      simulatedResponses[Math.floor(Math.random() * simulatedResponses.length)];

    addMessage({
      role: "assistant",
      content: randomResponse,
    });

    setIsLoading(false);
  };

  // Handle keyboard events
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Check if can send
  const canSend = inputValue.trim().length > 0 && !isLoading && !disabled;

  return (
    <div
      className={cn(
        "p-4 border-t border-gray-200 dark:border-white/5",
        "bg-white dark:bg-dark-surface"
      )}
    >
      {/* Input Container */}
      <div
        className={cn(
          "flex items-end gap-2 p-2",
          "bg-gray-100 dark:bg-white/5 rounded-xl",
          "focus-within:ring-2 focus-within:ring-primary/50",
          "transition-shadow"
        )}
      >
        {/* Attachment Button (optional feature) */}
        <button
          className={cn(
            "p-2 rounded-lg",
            "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            "hover:bg-gray-200 dark:hover:bg-white/10",
            "transition-colors",
            "hidden sm:block" // Hide on mobile
          )}
          title="Attach file"
          disabled={disabled}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none",
            "bg-transparent outline-none",
            "text-sm text-gray-900 dark:text-white",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "min-h-[40px] max-h-[120px]",
            "py-2 px-2",
            "disabled:opacity-50"
          )}
        />

        {/* Voice Input Button (optional feature) */}
        <button
          className={cn(
            "p-2 rounded-lg",
            "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
            "hover:bg-gray-200 dark:hover:bg-white/10",
            "transition-colors",
            "hidden sm:block" // Hide on mobile
          )}
          title="Voice input"
          disabled={disabled}
        >
          <Mic className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "p-2.5 rounded-xl",
            "transition-all duration-200",
            canSend
              ? "bg-gradient-to-r from-primary to-accent text-white hover:opacity-90"
              : "bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed"
          )}
          title="Send message"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-400 mt-2 text-center">
        Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded text-xs">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-white/10 rounded text-xs">Shift + Enter</kbd> for new line
      </p>
    </div>
  );
}

// ==========================================
// Export ChatToggleButton from ChatPanel
// ==========================================
export { ChatToggleButton } from "@/components/chat/ChatPanel";