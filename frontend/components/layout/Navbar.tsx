"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  Sun,
  Moon,
  User,
  Settings,
  LogOut,
  HelpCircle,
  ChevronDown,
  LayoutDashboard,
  Upload,
  History,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button, IconButton } from "@/components/ui/Button";

// Navigation links
const navLinks = [
  { href: "/", label: "Upload", icon: Upload },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
];

// User menu items
const userMenuItems = [
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Help", icon: HelpCircle, href: "/help" },
  { label: "Sign Out", icon: LogOut, href: "/auth/logout", danger: true },
];

export function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <nav
      className={cn(
        "sticky top-0 z-50",
        "bg-white/80 dark:bg-dark-surface/80",
        "backdrop-blur-xl",
        "border-b border-gray-200 dark:border-white/5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Logo & Nav */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl",
                  "bg-gradient-to-br from-primary to-accent",
                  "flex items-center justify-center",
                  "group-hover:shadow-glow transition-shadow"
                )}
              >
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span
                className={cn(
                  "text-xl font-bold",
                  "bg-gradient-to-r from-primary to-accent",
                  "bg-clip-text text-transparent",
                  "hidden sm:block"
                )}
              >
                AI Analyst
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl",
                      "text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <IconButton
              icon={
                resolvedTheme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )
              }
              onClick={toggleTheme}
              aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
              className="text-gray-600 dark:text-gray-400"
            />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "flex items-center gap-2 p-1.5 pr-3 rounded-xl",
                  "bg-gray-100 dark:bg-white/5",
                  "hover:bg-gray-200 dark:hover:bg-white/10",
                  "transition-colors"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg",
                    "bg-gradient-to-br from-primary to-accent",
                    "flex items-center justify-center"
                  )}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-gray-500 transition-transform",
                    userMenuOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />

                  {/* Menu */}
                  <div
                    className={cn(
                      "absolute right-0 mt-2 w-56 z-20",
                      "bg-white dark:bg-dark-surface",
                      "border border-gray-200 dark:border-white/10",
                      "rounded-xl shadow-lg",
                      "py-2",
                      "animate-in"
                    )}
                  >
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-white/5">
                      <p className="font-medium text-gray-900 dark:text-white">
                        John Doe
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        john@example.com
                      </p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      {userMenuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setUserMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2.5",
                              "text-sm transition-colors",
                              item.danger
                                ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200 dark:border-white/5">
        <div className="flex items-center justify-around py-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 rounded-xl",
                  "text-xs font-medium transition-all",
                  isActive
                    ? "text-primary"
                    : "text-gray-500 dark:text-gray-400"
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}