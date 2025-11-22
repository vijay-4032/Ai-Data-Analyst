"use client";

import { useEffect, useRef } from "react";
import { MessageSquare, X, Trash2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/Button";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { useChatStore } from "@/stores/useChatStore";

// ==========================================
// Chat Panel Header
// ==========================================
function ChatHeader() {
  const { closeChat, clearMessages } = useChatStore();

  return (
    <div
      className={cn(
        "flex items-center justify-between p-4",
        "border-b border-gray-200 dark:border-white/5"
      )}
    >
      <div className="flex items-center gap-3">
        {/* AI Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl",
            "bg-gradient-to-br from-primary to-accent",
            "flex items-center justify-center"
          )}
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </div>

        {/* Title */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            AI Insights
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Ask about your data
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <IconButton
          icon={<Trash2 className="w-4 h-4" />}
          aria-label="Clear chat"
          onClick={clearMessages}
          size="sm"
          className="text-gray-500 hover:text-red-500"
        />
        <IconButton
          icon={<X className="w-4 h-4" />}
          aria-label="Close chat"
          onClick={closeChat}
          size="sm"
        />
      </div>
    </div>
  );
}

// ==========================================
// Chat Messages Container
// ==========================================
function ChatMessages() {
  const { messages, isLoading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-lg flex-shrink-0",
              "bg-gradient-to-br from-primary to-accent",
              "flex items-center justify-center"
            )}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div
            className={cn(
              "px-4 py-3 rounded-2xl",
              "bg-gray-100 dark:bg-white/5"
            )}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}

// ==========================================
// Suggested Questions
// ==========================================
function SuggestedQuestions() {
  const { suggestedQuestions, setInputValue } = useChatStore();

  return (
    <div className="px-4 pb-2">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {suggestedQuestions.slice(0, 3).map((question, index) => (
          <button
            key={index}
            onClick={() => setInputValue(question)}
            className={cn(
              "whitespace-nowrap px-3 py-1.5 rounded-full",
              "text-xs font-medium",
              "bg-gray-100 dark:bg-white/5",
              "text-gray-600 dark:text-gray-400",
              "hover:bg-gray-200 dark:hover:bg-white/10",
              "hover:text-gray-900 dark:hover:text-white",
              "transition-colors"
            )}
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// Main Chat Panel Component
// ==========================================
export function ChatPanel() {
  return (
    <Card
      padding="none"
      className={cn(
        "flex flex-col h-[calc(100vh-180px)] sticky top-24",
        "overflow-hidden"
      )}
    >
      {/* Header */}
      <ChatHeader />

      {/* Messages */}
      <ChatMessages />

      {/* Suggested Questions */}
      <SuggestedQuestions />

      {/* Input */}
      <ChatInput />
    </Card>
  );
}

// ==========================================
// Floating Chat Toggle Button
// ==========================================
export function ChatToggleButton() {
  const { openChat } = useChatStore();

  return (
    <button
      onClick={openChat}
      className={cn(
        "fixed bottom-6 right-6 z-40",
        "p-4 rounded-2xl",
        "bg-gradient-to-r from-primary to-accent",
        "text-white shadow-lg shadow-primary/25",
        "hover:shadow-xl hover:shadow-primary/30",
        "hover:scale-105 active:scale-95",
        "transition-all duration-200"
      )}
      aria-label="Open AI chat"
    >
      <MessageSquare className="w-6 h-6" />
    </button>
  );
}