"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast types
export interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

// Global toast state (simple pub/sub pattern)
type ToastListener = (toasts: Toast[]) => void;
let toasts: Toast[] = [];
let listeners: ToastListener[] = [];

const notifyListeners = () => {
  listeners.forEach((listener) => listener([...toasts]));
};

// Public API to create toasts
export const toast = {
  success: (title: string, message?: string) => {
    addToast({ type: "success", title, message });
  },
  error: (title: string, message?: string) => {
    addToast({ type: "error", title, message });
  },
  warning: (title: string, message?: string) => {
    addToast({ type: "warning", title, message });
  },
  info: (title: string, message?: string) => {
    addToast({ type: "info", title, message });
  },
  dismiss: (id: string) => {
    removeToast(id);
  },
  dismissAll: () => {
    toasts = [];
    notifyListeners();
  },
};

function addToast(toast: Omit<Toast, "id">) {
  const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const newToast: Toast = {
    ...toast,
    id,
    duration: toast.duration ?? (toast.type === "error" ? 5000 : 3000),
  };
  toasts = [...toasts, newToast];
  notifyListeners();

  // Auto dismiss
  if (newToast.duration && newToast.duration > 0) {
    setTimeout(() => removeToast(id), newToast.duration);
  }
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notifyListeners();
}

// Icon mapping
const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

// Color mapping
const colors = {
  success: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: "text-emerald-500",
    title: "text-emerald-500",
  },
  error: {
    bg: "bg-red-500/10 border-red-500/20",
    icon: "text-red-500",
    title: "text-red-500",
  },
  warning: {
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: "text-amber-500",
    title: "text-amber-500",
  },
  info: {
    bg: "bg-blue-500/10 border-blue-500/20",
    icon: "text-blue-500",
    title: "text-blue-500",
  },
};

// Single Toast Component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const Icon = icons[toast.type];
  const color = colors[toast.type];

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl",
        "transform transition-all duration-200 ease-out",
        color.bg,
        isVisible && !isLeaving
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", color.icon)} />
      
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", color.title)}>{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>
    </div>
  );
}

// Toaster Container Component
export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Subscribe to toast updates
    const listener: ToastListener = (newToasts) => {
      setCurrentToasts(newToasts);
    };
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {currentToasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={() => toast.dismiss(t.id)}
        />
      ))}
    </div>
  );
}