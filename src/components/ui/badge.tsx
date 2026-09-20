import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "live" | "info" | "warning" | "critical" | "neutral" | "outline";
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "neutral",
  dot = false,
  children,
  ...props
}) => {
  const variantStyles = {
    live: "bg-accent-live/10 text-accent-live border-accent-live/25",
    info: "bg-accent-info/10 text-accent-info border-accent-info/25",
    warning: "bg-accent-warning/10 text-accent-warning border-accent-warning/25",
    critical: "bg-accent-critical/10 text-accent-critical border-accent-critical/25",
    neutral: "bg-surface-3 text-text-secondary border-border-subtle",
    outline: "bg-transparent text-text-secondary border-border-subtle",
  };

  const dotColors = {
    live: "bg-accent-live animate-pulse",
    info: "bg-accent-info",
    warning: "bg-accent-warning",
    critical: "bg-accent-critical",
    neutral: "bg-text-tertiary",
    outline: "bg-text-tertiary",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[11px] font-medium border tabular-nums transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColors[variant])}
        />
      )}
      {children}
    </span>
  );
};
