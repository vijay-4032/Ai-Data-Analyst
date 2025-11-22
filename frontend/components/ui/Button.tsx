import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Button variants using CVA (class-variance-authority)
const buttonVariants = cva(
  // Base styles applied to all buttons
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium text-sm",
    "rounded-xl",
    "transition-all duration-200",
    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
    "dark:focus:ring-offset-dark-300",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        // Primary gradient button
        primary: [
          "bg-gradient-to-r from-primary to-accent",
          "text-white",
          "shadow-lg shadow-primary/25",
          "hover:shadow-xl hover:shadow-primary/30",
          "hover:opacity-90",
        ],
        // Secondary solid button
        secondary: [
          "bg-gray-100 dark:bg-white/5",
          "text-gray-900 dark:text-white",
          "border border-gray-200 dark:border-white/10",
          "hover:bg-gray-200 dark:hover:bg-white/10",
        ],
        // Ghost transparent button
        ghost: [
          "bg-transparent",
          "text-gray-700 dark:text-gray-300",
          "hover:bg-gray-100 dark:hover:bg-white/5",
        ],
        // Outline button
        outline: [
          "bg-transparent",
          "border-2 border-primary",
          "text-primary",
          "hover:bg-primary hover:text-white",
        ],
        // Danger button
        danger: [
          "bg-red-500",
          "text-white",
          "hover:bg-red-600",
          "shadow-lg shadow-red-500/25",
        ],
        // Success button
        success: [
          "bg-emerald-500",
          "text-white",
          "hover:bg-emerald-600",
          "shadow-lg shadow-emerald-500/25",
        ],
        // Link style button
        link: [
          "bg-transparent",
          "text-primary",
          "underline-offset-4 hover:underline",
          "p-0 h-auto",
        ],
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-12 w-12 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Button props interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// Button component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin" />
        )}

        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}

        {/* Button text */}
        {children && <span>{children}</span>}

        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// Icon-only button variant
export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon,
      variant = "ghost",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeMap = {
      sm: "icon-sm" as const,
      md: "icon" as const,
      lg: "icon-lg" as const,
    };

    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size: sizeMap[size] }),
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export { Button, IconButton, buttonVariants };