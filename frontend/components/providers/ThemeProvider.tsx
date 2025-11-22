"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "dark" | "light";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  attribute = "class",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Get system theme preference
  const getSystemTheme = (): "dark" | "light" => {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Apply theme to document
  const applyTheme = (newTheme: Theme) => {
    if (typeof window === "undefined") return;
    
    const root = document.documentElement;
    const resolved = newTheme === "system" ? getSystemTheme() : newTheme;

    // Disable transitions temporarily
    if (disableTransitionOnChange) {
      root.style.setProperty("transition", "none");
    }

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    // Apply new theme
    if (attribute === "class") {
      root.classList.add(resolved);
    } else {
      root.setAttribute(attribute, resolved);
    }

    setResolvedTheme(resolved);

    // Re-enable transitions
    if (disableTransitionOnChange) {
      setTimeout(() => {
        root.style.removeProperty("transition");
      }, 0);
    }
  };

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("ai-analyst-theme", newTheme);
    }
    applyTheme(newTheme);
  };

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("ai-analyst-theme") as Theme | null;
    const initialTheme = savedTheme || defaultTheme;
    setThemeState(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, [defaultTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!enableSystem || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, enableSystem]);

  // Always provide context value, even before mount
  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  // Prevent flash of wrong theme by hiding content until mounted
  return (
    <ThemeContext.Provider value={value}>
      <div style={{ visibility: mounted ? "visible" : "hidden" }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Hook to access theme context
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  // Return default values if context is undefined (shouldn't happen with proper setup)
  if (context === undefined) {
    // Instead of throwing, return safe defaults for SSR/initial render
    return {
      theme: "dark",
      setTheme: () => {},
      resolvedTheme: "dark",
    };
  }
  
  return context;
}

// Hook to check if component is mounted (for SSR)
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}