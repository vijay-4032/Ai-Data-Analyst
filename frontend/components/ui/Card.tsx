import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Card variants
const cardVariants = cva(
  // Base styles
  [
    "rounded-2xl",
    "border",
    "transition-all duration-200",
  ],
  {
    variants: {
      variant: {
        // Default card
        default: [
          "bg-white dark:bg-dark-surface/80",
          "border-gray-200 dark:border-white/5",
          "backdrop-blur-xl",
        ],
        // Glass morphism card
        glass: [
          "bg-white/60 dark:bg-dark-surface/60",
          "border-white/20 dark:border-white/5",
          "backdrop-blur-xl",
          "shadow-lg",
        ],
        // Outlined card
        outline: [
          "bg-transparent",
          "border-gray-300 dark:border-white/10",
        ],
        // Elevated card with shadow
        elevated: [
          "bg-white dark:bg-dark-surface",
          "border-transparent",
          "shadow-card dark:shadow-card-dark",
        ],
        // Gradient border card
        gradient: [
          "bg-white dark:bg-dark-surface",
          "border-transparent",
          "bg-gradient-to-r from-primary/10 to-accent/10",
          "dark:from-primary/5 dark:to-accent/5",
        ],
      },
      interactive: {
        true: [
          "cursor-pointer",
          "hover:scale-[1.02]",
          "hover:shadow-lg dark:hover:shadow-card-dark",
          "active:scale-[0.99]",
        ],
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
);

// Card component props
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

// Main Card component
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, padding, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, interactive, padding }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-between mb-4", className)}
        {...props}
      >
        <div>{children}</div>
        {action && <div>{action}</div>}
      </div>
    );
  }
);
CardHeader.displayName = "CardHeader";

// Card Title
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn("font-semibold text-lg text-gray-900 dark:text-white", className)}
      {...props}
    />
  );
});
CardTitle.displayName = "CardTitle";

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500 dark:text-gray-400 mt-1", className)}
      {...props}
    />
  );
});
CardDescription.displayName = "CardDescription";

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn("", className)} {...props} />;
});
CardContent.displayName = "CardContent";

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-white/5",
        className
      )}
      {...props}
    />
  );
});
CardFooter.displayName = "CardFooter";

// Stat Card - specialized card for KPIs
interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, label, value, change, changeLabel, icon, trend, ...props }, ref) => {
    const trendColors = {
      up: "text-emerald-500",
      down: "text-red-500",
      neutral: "text-gray-500",
    };

    const determinedTrend = trend || (change && change > 0 ? "up" : change && change < 0 ? "down" : "neutral");

    return (
      <Card
        ref={ref}
        className={cn("group", className)}
        interactive
        {...props}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {label}
          </span>
          {icon && (
            <span className="text-primary group-hover:scale-110 transition-transform">
              {icon}
            </span>
          )}
        </div>
        
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </div>
        
        {(change !== undefined || changeLabel) && (
          <div className={cn("text-sm mt-1", trendColors[determinedTrend])}>
            {change !== undefined && (
              <span>
                {change > 0 ? "+" : ""}
                {typeof change === "number" ? `${change.toFixed(1)}%` : change}
              </span>
            )}
            {changeLabel && <span className="ml-1">{changeLabel}</span>}
          </div>
        )}
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  cardVariants,
};